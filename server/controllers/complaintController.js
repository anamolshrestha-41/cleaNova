const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const validateImage = require('../utils/imageValidator');

const DUPLICATE_RADIUS_M = 100;

// Strip HTML tags to prevent stored XSS
const sanitize = (str) => (str || '').replace(/<[^>]*>/g, '').trim();

const createComplaint = async (req, res) => {
  try {
    const { description, lat, lng, userName, isAnonymous, city, wardNumber } = req.body;

    if (!lat || !lng)
      return res.status(400).json({ code: 'MISSING_LOCATION', message: 'Location is required.' });
    if (!description?.trim())
      return res.status(400).json({ code: 'MISSING_DESCRIPTION', message: 'Description is required.' });

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng) ||
        parsedLat < -90 || parsedLat > 90 ||
        parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ code: 'INVALID_LOCATION', message: 'Invalid coordinates.' });
    }

    // Geospatial duplicate detection — $near uses 2dsphere index (fast, no full scan)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const duplicate = await Complaint.findOne({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: DUPLICATE_RADIUS_M,
        },
      },
      createdAt: { $gte: since },
      moderationStatus: { $ne: 'spam' },
    }).select('_id description upvotes');

    if (duplicate) {
      return res.status(409).json({
        code: 'DUPLICATE',
        message: 'A complaint has already been reported at this location.',
        existing: { _id: duplicate._id, description: duplicate.description, upvotes: duplicate.upvotes },
      });
    }

    // Image validation
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      const imgCheck = validateImage(filePath, description);
      if (!imgCheck.valid) {
        try { fs.unlinkSync(filePath); } catch {}
        return res.status(422).json({ code: 'INVALID_IMAGE', message: imgCheck.reason });
      }
    }

    const complaint = await Complaint.create({
      description: sanitize(description),
      location: {
        type: 'Point',
        coordinates: [parsedLng, parsedLat],
        lat: parsedLat,
        lng: parsedLng,
      },
      city: sanitize(city),
      wardNumber: wardNumber ? parseInt(wardNumber) : null,
      userName: isAnonymous === 'true' ? '' : sanitize(userName),
      isAnonymous: isAnonymous === 'true',
      image,
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
    const update = { status, resolvedAt: status === 'resolved' ? new Date() : null };
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    res.json(complaint);
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

module.exports = { createComplaint, getComplaints, updateStatus, upvoteComplaint, moderateComplaint, getFlagged };
