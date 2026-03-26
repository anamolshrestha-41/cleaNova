const Complaint = require('../models/Complaint');

const getStats = async (req, res) => {
  try {
    // Single aggregation for all top-level counts + avg response
    const [summary] = await Complaint.aggregate([
      {
        $facet: {
          counts: [
            { $group: {
              _id: '$status',
              count: { $sum: 1 },
            }},
          ],
          avgResponse: [
            { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
            { $group: {
              _id: null,
              avgMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } },
            }},
          ],
          wardStats: [
            { $match: { wardNumber: { $ne: null } } },
            { $group: {
              _id: '$wardNumber',
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
              open: { $sum: { $cond: [{ $ne: ['$status', 'resolved'] }, 1, 0] } },
              avgResponseMs: {
                $avg: {
                  $cond: [
                    { $and: [{ $eq: ['$status', 'resolved'] }, { $ne: ['$resolvedAt', null] }] },
                    { $subtract: ['$resolvedAt', '$createdAt'] },
                    null,
                  ],
                },
              },
            }},
            { $addFields: {
              resolutionRate: {
                $cond: [{ $gt: ['$total', 0] },
                  { $round: [{ $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 0] }, 0],
              },
              avgResponseHours: {
                $cond: [{ $ne: ['$avgResponseMs', null] },
                  { $round: [{ $divide: ['$avgResponseMs', 3600000] }, 1] }, null],
              },
            }},
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const countMap = Object.fromEntries(summary.counts.map(c => [c._id, c.count]));
    const total = Object.values(countMap).reduce((a, b) => a + b, 0);
    const resolved = countMap['resolved'] || 0;
    const pending = countMap['pending'] || 0;
    const inProgress = countMap['in-progress'] || 0;
    const avgMs = summary.avgResponse[0]?.avgMs ?? null;

    res.json({
      total,
      resolved,
      pending,
      inProgress,
      resolvedPct: total ? Math.round((resolved / total) * 100) : 0,
      pendingPct: total ? Math.round((pending / total) * 100) : 0,
      avgResponseHours: avgMs ? Math.round(avgMs / 3600000 * 10) / 10 : null,
      wardStats: summary.wardStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats };
