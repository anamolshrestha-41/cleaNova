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
  await Admin.create({ email: 'admin@cleanvoa.com', password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!', role: 'admin' });
  console.log('Admin created: admin@cleanvoa.com');

  // Seed 32 ward officers — all share the same password for now
  const bcrypt = require('bcryptjs');
  const wardPassword = process.env.SEED_WARD_PASSWORD || 'ward123';
  const hashedWardPassword = await bcrypt.hash(wardPassword, 10);
  const wardOfficers = Array.from({ length: 32 }, (_, i) => ({
    email: `ward${i + 1}@cleanvoa.com`,
    password: hashedWardPassword,
    role: 'ward',
    wardNumber: i + 1,
  }));
  await Admin.insertMany(wardOfficers);
  console.log('32 ward officers seeded (ward1@cleanvoa.com … ward32@cleanvoa.com / ward123)');

  await Complaint.deleteMany();
  const now = Date.now();
  await Complaint.insertMany([
    {
      description: 'Broken drainage pipe leaking sewage onto the main road near Maharajgunj. Foul smell and slippery road surface causing accidents. Reported to ward office twice with no response.',
      location: loc(3), city: 'Kathmandu', wardNumber: 3,
      userName: 'Anita Gurung', isAnonymous: false,
      status: 'pending', upvotes: 21,
      image: '/uploads/1774496196694.png',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      locationVerification: 'verified',
    },
    {
      description: 'Overflowing garbage bin outside Ason Bazaar market. Waste spilling onto the footpath for 5 days. Flies and foul smell affecting shopkeepers and pedestrians.',
      location: loc(4), city: 'Kathmandu', wardNumber: 4,
      userName: 'Ram Shrestha', isAnonymous: false,
      status: 'in-progress', upvotes: 14,
      image: '/uploads/1774496618627.png',
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      locationVerification: 'verified',
    },
    {
      description: 'Illegal dumping of construction debris on Bagmati riverbank near Teku bridge. Blocking water flow and causing flooding risk. Debris includes concrete, iron rods and plastic.',
      location: loc(12), city: 'Kathmandu', wardNumber: 12,
      userName: '', isAnonymous: true,
      status: 'pending', upvotes: 9,
      image: '/uploads/1774497041985.png',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      locationVerification: 'verified',
    },
    {
      description: 'Plastic bags and food waste scattered near Swayambhu stupa entrance. Garbage truck has not visited in 9 days. Affecting tourists and local residents badly.',
      location: loc(16), city: 'Kathmandu', wardNumber: 16,
      userName: 'Bikash Maharjan', isAnonymous: false,
      status: 'resolved', upvotes: 17,
      image: '/uploads/1774490775231.jpg',
      createdAt: new Date(now - 12 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      locationVerification: 'verified',
    },
    {
      description: 'Large pile of household waste dumped on the roadside near Koteshwor chowk. Blocking one lane of traffic. Rodents spotted near the pile at night.',
      location: loc(32), city: 'Kathmandu', wardNumber: 32,
      userName: '', isAnonymous: true,
      status: 'in-progress', upvotes: 6,
      image: '/uploads/1774490423789.jpg',
      createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      locationVerification: 'verified',
    },
  ]);
  console.log('5 sample Kathmandu complaints seeded.');
  process.exit();
};

seed().catch((e) => { console.error(e); process.exit(1); });
