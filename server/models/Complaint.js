const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  description: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    // Legacy flat fields kept for backward compat with existing docs
    lat: { type: Number },
    lng: { type: Number },
  },
  city: { type: String, default: 'Kathmandu' },
  wardNumber: { type: Number, min: 1, max: 32, default: null },
  userName: { type: String, default: '' },
  isAnonymous: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending',
  },
  resolvedAt: { type: Date, default: null },
  upvotes: { type: Number, default: 0 },
  count: { type: Number, default: 1 },
  locationVerification: {
    type: String,
    enum: ['verified', 'unverified', 'suspicious'],
    default: 'unverified',
  },
  flagged: { type: Boolean, default: false },
  moderationStatus: {
    type: String,
    enum: ['approved', 'pending_review', 'rejected', 'spam'],
    default: 'approved',
  },
}, { timestamps: true });

// Geospatial index for $near duplicate detection
complaintSchema.index({ location: '2dsphere' });

// TTL index: auto-delete resolved complaints 10 minutes after resolvedAt
complaintSchema.index(
  { resolvedAt: 1 },
  { expireAfterSeconds: 600, partialFilterExpression: { resolvedAt: { $type: 'date' } } }
);

module.exports = mongoose.model('Complaint', complaintSchema);
