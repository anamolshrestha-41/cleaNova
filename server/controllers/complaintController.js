const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const validateImage = require('../utils/imageValidator');
const detectWard = require('../utils/wardDetector');
const haversine = require('../utils/haversine');

const DUPLICATE_RADIUS_M = 100;
const WARD_VERIFY_RADIUS_M = 1000;  // 1km from ward centre = verified

// Kathmandu ward centres (same as wardDetector)
const KTM_WARDS = [
  { ward: 1,  lat: 27.7172, lng: 85.3240 }, { ward: 2,  lat: 27.7195, lng: 85.3175 },
  { ward: 3,  lat: 27.7210, lng: 85.3100 }, { ward: 4,  lat: 27.7230, lng: 85.3050 },
  { ward: 5,  lat: 27.7260, lng: 85.2990 }, { ward: 6,  lat: 27.7290, lng: 85.3060 },
  { ward: 7,  lat: 27.7315, lng: 85.3130 }, { ward: 8,  lat: 27.7340, lng: 85.3200 },
  { ward: 9,  lat: 27.7360, lng: 85.3270 }, { ward: 10, lat: 27.7380, lng: 85.3340 },
  { ward: 11, lat: 27.7050, lng: 85.3150 }, { ward: 12, lat: 27.7080, lng: 85.3220 },
  { ward: 13, lat: 27.7100, lng: 85.3290 }, { ward: 14, lat: 27.7120, lng: 85.3360 },
  { ward: 15, lat: 27.7140, lng: 85.3430 }, { ward: 16, lat: 27.7000, lng: 85.3310 },
  { ward: 17, lat: 27.6970, lng: 85.3380 }, { ward: 18, lat: 27.6940, lng: 85.3450 },
  { ward: 19, lat: 27.6910, lng: 85.3520 }, { ward: 20, lat: 27.6880, lng: 85.3590 },
  { ward: 21, lat: 27.7160, lng: 85.3500 }, { ward: 22, lat: 27.7180, lng: 85.3570 },
  { ward: 23, lat: 27.7200, lng: 85.3640 }, { ward: 24, lat: 27.7220, lng: 85.3710 },
  { ward: 25, lat: 27.7240, lng: 85.3780 }, { ward: 26, lat: 27.7050, lng: 85.3600 },
  { ward: 27, lat: 27.7020, lng: 85.3670 }, { ward: 28, lat: 27.6990, lng: 85.3740 },
  { ward: 29, lat: 27.6960, lng: 85.3810 }, { ward: 30, lat: 27.6930, lng: 85.3880 },
  { ward: 31, lat: 27.7300, lng: 85.3400 }, { ward: 32, lat: 27.7320, lng: 85.3470 },
];

// In-memory IP spam tracker: ip -> [timestamps] (last 10 min)
const spamTracker = new Map();
const SPAM_WINDOW_MS = 10 * 60 * 1000;
const SPAM_THRESHOLD = 3;

const checkSpam = (ip) => {
  const now = Date.now();
  const times = (spamTracker.get(ip) || []).filter(t => now - t < SPAM_WINDOW_MS);
  times.push(now);
  spamTracker.set(ip, times);
  return times.length >= SPAM_THRESHOLD;
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of spamTracker.entries()) {
    const fresh = times.filter(t => now - t < SPAM_WINDOW_MS);
    fresh.length === 0 ? spamTracker.delete(ip) : spamTracker.set(ip, fresh);
  }
}, SPAM_WINDOW_MS);

// Strip HTML tags to prevent stored XSS
const sanitize = (str) => (str || '').replace(/<[^>]*>/g, '').trim();

const createComplaint = async (req, res) => {
  try {
    const { description, lat, lng, userName, isAnonymous, city, wardNumber } = req.body;

    if (!lat || !lng)
      return res.status(400).json({ code: 'MISSING_LOCATION', message: 'Location is required.' });
    if (!description?.trim())
      return res.status(400).json({ code: 'MISSING_DESCRIPTION', message: 'Description is required.' });
    if (!req.file)
      return res.status(400).json({ code: 'MISSING_IMAGE', message: 'A photo is required.' });

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng) ||
        parsedLat < -90 || parsedLat > 90 ||
        parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ code: 'INVALID_LOCATION', message: 'Invalid coordinates.' });
    }

    // Geospatial duplicate detection — skip resolved complaints (they are being cleaned up)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const duplicate = await Complaint.findOne({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: DUPLICATE_RADIUS_M,
        },
      },
      status: { $ne: 'resolved' }, // resolved complaints should not block new reports
      createdAt: { $gte: since },
      moderationStatus: { $ne: 'spam' },
    }).select('_id description upvotes count');

    if (duplicate) {
      const updated = await Complaint.findByIdAndUpdate(
        duplicate._id,
        { $inc: { count: 1 } },
        { new: true }
      );
      return res.status(200).json({ duplicate: true, complaint: updated });
    }

    // Image validation
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      const imgCheck = validateImage(filePath);
      if (!imgCheck.valid) {
        try { fs.unlinkSync(filePath); } catch {}
        return res.status(422).json({ code: 'INVALID_IMAGE', message: imgCheck.reason });
      }
    }

    // Auto-detect ward from GPS — Nominatim first, nearest centre fallback
    const detectedWard = await detectWard(parsedLat, parsedLng);

    // Smart location verification
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const wardCentre = KTM_WARDS.find(w => w.ward === detectedWard);
    const distToWard = wardCentre ? haversine(parsedLat, parsedLng, wardCentre.lat, wardCentre.lng) : Infinity;
    const isSpam = checkSpam(ip);
    const locationVerification = isSpam ? 'suspicious' : distToWard <= WARD_VERIFY_RADIUS_M ? 'verified' : 'unverified';

    const complaint = await Complaint.create({
      description: sanitize(description),
      location: {
        type: 'Point',
        coordinates: [parsedLng, parsedLat],
        lat: parsedLat,
        lng: parsedLng,
      },
      city: 'Kathmandu',
      wardNumber: detectedWard,
      userName: isAnonymous === 'true' ? '' : sanitize(userName),
      isAnonymous: isAnonymous === 'true',
      image,
      locationVerification,
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getComplaints = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      Complaint.find({ moderationStatus: { $ne: 'spam' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments({ moderationStatus: { $ne: 'spam' } }),
    ]);

    res.json({ complaints, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Not found' });

    // Ward officers can only update complaints in their own ward
    if (req.admin.role === 'ward' && complaint.wardNumber !== req.admin.wardNumber)
      return res.status(403).json({ message: 'You can only update complaints in your ward.' });

    complaint.status = status;
    complaint.resolvedAt = status === 'resolved' ? new Date() : null;
    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getWardComplaints = async (req, res) => {
  try {
    const wardNumber = parseInt(req.admin.wardNumber);
    const complaints = await Complaint.find({ wardNumber, moderationStatus: { $ne: 'spam' } })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const upvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    res.json({ upvotes: complaint.upvotes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const moderateComplaint = async (req, res) => {
  try {
    const { moderationStatus } = req.body;
    const allowed = ['approved', 'pending_review', 'rejected', 'spam'];
    if (!allowed.includes(moderationStatus))
      return res.status(400).json({ message: 'Invalid moderation status.' });

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { moderationStatus, flagged: moderationStatus === 'pending_review' },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFlagged = async (req, res) => {
  try {
    const complaints = await Complaint.find({ moderationStatus: 'pending_review' })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createComplaint, getComplaints, updateStatus, getWardComplaints, upvoteComplaint, moderateComplaint, getFlagged };
