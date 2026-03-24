require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Loads the model which triggers index creation via Mongoose syncIndexes
const Complaint = require('./models/Complaint');

const run = async () => {
  await connectDB();
  // Drop any stale TTL index on resolvedAt, then recreate
  try {
    await Complaint.collection.dropIndex('resolvedAt_1');
    console.log('Dropped old resolvedAt index.');
  } catch {
    console.log('No existing resolvedAt index to drop.');
  }
  await Complaint.syncIndexes();
  console.log('Indexes synced: 2dsphere on location, TTL on resolvedAt.');
  process.exit();
};

run().catch(e => { console.error(e); process.exit(1); });
