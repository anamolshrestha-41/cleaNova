require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Complaint = require('./models/Complaint');
const connectDB = require('./config/db');

// Approximate centres of Kathmandu wards 1–32
// Source: Kathmandu Metropolitan City ward office locations
const KTM_WARDS = [
  { ward: 1,  lat: 27.7172, lng: 85.3240 },
  { ward: 2,  lat: 27.7195, lng: 85.3175 },
  { ward: 3,  lat: 27.7210, lng: 85.3100 },
  { ward: 4,  lat: 27.7230, lng: 85.3050 },
  { ward: 5,  lat: 27.7260, lng: 85.2990 },
  { ward: 6,  lat: 27.7290, lng: 85.3060 },
  { ward: 7,  lat: 27.7315, lng: 85.3130 },
  { ward: 8,  lat: 27.7340, lng: 85.3200 },
  { ward: 9,  lat: 27.7360, lng: 85.3270 },
  { ward: 10, lat: 27.7380, lng: 85.3340 },
  { ward: 11, lat: 27.7050, lng: 85.3150 },
  { ward: 12, lat: 27.7080, lng: 85.3220 },
  { ward: 13, lat: 27.7100, lng: 85.3290 },
  { ward: 14, lat: 27.7120, lng: 85.3360 },
  { ward: 15, lat: 27.7140, lng: 85.3430 },
  { ward: 16, lat: 27.7000, lng: 85.3310 },
  { ward: 17, lat: 27.6970, lng: 85.3380 },
  { ward: 18, lat: 27.6940, lng: 85.3450 },
  { ward: 19, lat: 27.6910, lng: 85.3520 },
  { ward: 20, lat: 27.6880, lng: 85.3590 },
  { ward: 21, lat: 27.7160, lng: 85.3500 },
  { ward: 22, lat: 27.7180, lng: 85.3570 },
  { ward: 23, lat: 27.7200, lng: 85.3640 },
  { ward: 24, lat: 27.7220, lng: 85.3710 },
  { ward: 25, lat: 27.7240, lng: 85.3780 },
  { ward: 26, lat: 27.7050, lng: 85.3600 },
  { ward: 27, lat: 27.7020, lng: 85.3670 },
  { ward: 28, lat: 27.6990, lng: 85.3740 },
  { ward: 29, lat: 27.6960, lng: 85.3810 },
  { ward: 30, lat: 27.6930, lng: 85.3880 },
  { ward: 31, lat: 27.7300, lng: 85.3400 },
  { ward: 32, lat: 27.7320, lng: 85.3470 },
];

const loc = (ward) => {
  const w = KTM_WARDS.find(x => x.ward === ward);
  return { type: 'Point', coordinates: [w.lng, w.lat], lat: w.lat, lng: w.lng };
};

const seed = async () => {
  await connectDB();

  await Admin.deleteMany();
  await Admin.create({ email: 'admin@cleanvoa.com', password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!' });
  console.log('Admin created: admin@cleanvoa.com');

  await Complaint.deleteMany();
  await Complaint.insertMany([
    {
      description: 'Large pile of garbage near the main market, attracting flies and rodents.',
      location: loc(4), city: 'Kathmandu', wardNumber: 4,
      userName: 'Ram Shrestha', isAnonymous: false, status: 'pending', image: '',
    },
    {
      description: 'Overflowing dumpster outside Ason Chowk, waste spilling onto the footpath.',
      location: loc(7), city: 'Kathmandu', wardNumber: 7,
      userName: '', isAnonymous: true, status: 'in-progress', image: '',
    },
    {
      description: 'Illegal dumping of construction waste near the riverbank.',
      location: loc(12), city: 'Kathmandu', wardNumber: 12,
      userName: 'Sita Tamang', isAnonymous: false, status: 'resolved', image: '',
    },
    {
      description: 'Broken waste bins outside the school, garbage scattered on the road.',
      location: loc(19), city: 'Kathmandu', wardNumber: 19,
      userName: '', isAnonymous: true, status: 'pending', image: '',
    },
    {
      description: 'Stagnant water mixed with garbage near the residential colony.',
      location: loc(25), city: 'Kathmandu', wardNumber: 25,
      userName: 'Bikash Maharjan', isAnonymous: false, status: 'pending', image: '',
    },
    {
      description: 'Garbage truck has not visited this ward in over 10 days.',
      location: loc(31), city: 'Kathmandu', wardNumber: 31,
      userName: '', isAnonymous: true, status: 'in-progress', image: '',
    },
  ]);
  console.log('Sample Kathmandu complaints seeded.');
  process.exit();
};

seed().catch((e) => { console.error(e); process.exit(1); });
