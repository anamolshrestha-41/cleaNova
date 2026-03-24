const Complaint = require('../models/Complaint');

const getStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: 'resolved' });
    const pending = await Complaint.countDocuments({ status: 'pending' });
    const inProgress = await Complaint.countDocuments({ status: 'in-progress' });

    const wardStats = await Complaint.aggregate([
      { $match: { wardNumber: { $ne: null } } },
      { $group: { _id: '$wardNumber', total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      total,
      resolved,
      pending,
      inProgress,
      resolvedPct: total ? Math.round((resolved / total) * 100) : 0,
      pendingPct: total ? Math.round((pending / total) * 100) : 0,
      wardStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats };
