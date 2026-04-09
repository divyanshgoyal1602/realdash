const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

const Office = require('../models/Office');
const User = require('../models/User');
const AAPTarget = require('../models/AAPTarget');
const Activity = require('../models/Activity');
const Alert = require('../models/Alert');

const OFFICES = [
  { name: 'India Tourism Delhi',      code: 'ITO-DEL', city: 'New Delhi',   state: 'Delhi',           region: 'North',     officerInCharge: 'Sh. Rajiv Kumar',    contactEmail: 'ito.delhi@tourism.gov.in',     coordinates: { lat: 28.6139, lng: 77.2090 } },
  { name: 'India Tourism Mumbai',     code: 'ITO-MUM', city: 'Mumbai',      state: 'Maharashtra',     region: 'West',      officerInCharge: 'Smt. Priya Sharma',   contactEmail: 'ito.mumbai@tourism.gov.in',    coordinates: { lat: 19.0760, lng: 72.8777 } },
  { name: 'India Tourism Chennai',    code: 'ITO-CHE', city: 'Chennai',     state: 'Tamil Nadu',      region: 'South',     officerInCharge: 'Sh. Mohan Rao',       contactEmail: 'ito.chennai@tourism.gov.in',   coordinates: { lat: 13.0827, lng: 80.2707 } },
  { name: 'India Tourism Kolkata',    code: 'ITO-KOL', city: 'Kolkata',     state: 'West Bengal',     region: 'East',      officerInCharge: 'Smt. Debjani Sen',    contactEmail: 'ito.kolkata@tourism.gov.in',   coordinates: { lat: 22.5726, lng: 88.3639 } },
  { name: 'India Tourism Bengaluru',  code: 'ITO-BLR', city: 'Bengaluru',   state: 'Karnataka',       region: 'South',     officerInCharge: 'Sh. Suresh Nair',     contactEmail: 'ito.bengaluru@tourism.gov.in', coordinates: { lat: 12.9716, lng: 77.5946 } },
  { name: 'India Tourism Hyderabad',  code: 'ITO-HYD', city: 'Hyderabad',   state: 'Telangana',       region: 'South',     officerInCharge: 'Sh. Vikram Reddy',    contactEmail: 'ito.hyderabad@tourism.gov.in', coordinates: { lat: 17.3850, lng: 78.4867 } },
  { name: 'India Tourism Agra',       code: 'ITO-AGR', city: 'Agra',        state: 'Uttar Pradesh',   region: 'North',     officerInCharge: 'Smt. Anjali Singh',   contactEmail: 'ito.agra@tourism.gov.in',      coordinates: { lat: 27.1767, lng: 78.0081 } },
  { name: 'India Tourism Varanasi',   code: 'ITO-VNS', city: 'Varanasi',    state: 'Uttar Pradesh',   region: 'North',     officerInCharge: 'Sh. Amit Pandey',     contactEmail: 'ito.varanasi@tourism.gov.in',  coordinates: { lat: 25.3176, lng: 82.9739 } },
  { name: 'India Tourism Jaipur',     code: 'ITO-JAI', city: 'Jaipur',      state: 'Rajasthan',       region: 'North',     officerInCharge: 'Sh. Bharat Meena',    contactEmail: 'ito.jaipur@tourism.gov.in',    coordinates: { lat: 26.9124, lng: 75.7873 } },
  { name: 'India Tourism Goa',        code: 'ITO-GOA', city: 'Panaji',      state: 'Goa',             region: 'West',      officerInCharge: 'Smt. Fatima Borges',  contactEmail: 'ito.goa@tourism.gov.in',       coordinates: { lat: 15.4909, lng: 73.8278 } },
  { name: 'India Tourism Aurangabad', code: 'ITO-AUR', city: 'Aurangabad',  state: 'Maharashtra',     region: 'West',      officerInCharge: 'Sh. Nitin Patil',     contactEmail: 'ito.aurangabad@tourism.gov.in',coordinates: { lat: 19.8762, lng: 75.3433 } },
  { name: 'India Tourism Patna',      code: 'ITO-PAT', city: 'Patna',       state: 'Bihar',           region: 'East',      officerInCharge: 'Sh. Sanjay Sinha',    contactEmail: 'ito.patna@tourism.gov.in',     coordinates: { lat: 25.5941, lng: 85.1376 } },
  { name: 'India Tourism Bhubaneswar',code: 'ITO-BHU', city: 'Bhubaneswar', state: 'Odisha',          region: 'East',      officerInCharge: 'Smt. Mamata Panda',   contactEmail: 'ito.bhubaneswar@tourism.gov.in',coordinates:{ lat: 20.2961, lng: 85.8245 } },
  { name: 'India Tourism Guwahati',   code: 'ITO-GUW', city: 'Guwahati',    state: 'Assam',           region: 'Northeast', officerInCharge: 'Sh. Bipul Baruah',    contactEmail: 'ito.guwahati@tourism.gov.in',  coordinates: { lat: 26.1445, lng: 91.7362 } },
  { name: 'India Tourism Kochi',      code: 'ITO-KOC', city: 'Kochi',       state: 'Kerala',          region: 'South',     officerInCharge: 'Sh. Thomas Mathew',   contactEmail: 'ito.kochi@tourism.gov.in',     coordinates: { lat: 9.9312,  lng: 76.2673 } },
  { name: 'India Tourism Chandigarh', code: 'ITO-CHD', city: 'Chandigarh',  state: 'Punjab',          region: 'North',     officerInCharge: 'Smt. Gurpreet Kaur',  contactEmail: 'ito.chandigarh@tourism.gov.in', coordinates: { lat: 30.7333, lng: 76.7794 } },
  { name: 'India Tourism Jammu',      code: 'ITO-JAM', city: 'Jammu',       state: 'J&K',             region: 'North',     officerInCharge: 'Sh. Ranbir Dogra',    contactEmail: 'ito.jammu@tourism.gov.in',     coordinates: { lat: 32.7266, lng: 74.8570 } },
  { name: 'India Tourism Khajuraho',  code: 'ITO-KHA', city: 'Khajuraho',   state: 'Madhya Pradesh',  region: 'Central',   officerInCharge: 'Smt. Rekha Tiwari',   contactEmail: 'ito.khajuraho@tourism.gov.in', coordinates: { lat: 24.8318, lng: 79.9199 } },
  { name: 'India Tourism Tirupati',   code: 'ITO-TIR', city: 'Tirupati',    state: 'Andhra Pradesh',  region: 'South',     officerInCharge: 'Sh. Venkat Raju',     contactEmail: 'ito.tirupati@tourism.gov.in',  coordinates: { lat: 13.6288, lng: 79.4192 } },
  { name: 'India Tourism Port Blair', code: 'ITO-PBL', city: 'Port Blair',  state: 'Andaman & Nicobar',region:'East',      officerInCharge: 'Smt. Anita Das',      contactEmail: 'ito.portblair@tourism.gov.in', coordinates: { lat: 11.6234, lng: 92.7265 } },
];

const CATEGORIES = [
  'Tourism Promotion', 'Tourist Facilitation', 'Media & Publicity',
  'Fairs & Festivals', 'Training & Capacity Building',
  'Infrastructure Development', 'Market Development Assistance',
  'Survey & Research', 'Coordination',
];

const STATUSES = ['Planned', 'In Progress', 'Completed', 'Delayed', 'Completed', 'Completed'];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected for seeding');
};

const seed = async () => {
  await connectDB();

  console.log('🗑  Clearing existing data...');
  await Promise.all([
    Office.deleteMany({}),
    User.deleteMany({}),
    AAPTarget.deleteMany({}),
    Activity.deleteMany({}),
    Alert.deleteMany({}),
  ]);

  console.log('🏢 Seeding 20 India Tourism Offices...');
  const createdOffices = await Office.insertMany(OFFICES);

  console.log('👤 Seeding users...');
  const superAdmin = await User.create({
    name: 'Ministry Admin',
    email: 'admin@tourism.gov.in',
    password: 'Admin@123',
    role: 'superadmin',
  });

  const ministryUser = await User.create({
    name: 'Ministry Viewer',
    email: 'ministry@tourism.gov.in',
    password: 'Ministry@123',
    role: 'ministry',
  });

  // Create one office admin per office
  for (const office of createdOffices) {
    await User.create({
      name: `${office.code} Admin`,
      email: `admin.${office.code.toLowerCase().replace('ito-', '')}@tourism.gov.in`,
      password: 'Office@123',
      role: 'office_admin',
      office: office._id,
    });
  }

  console.log('🎯 Seeding AAP Targets...');
  const aapTargets = [];
  for (const office of createdOffices) {
    for (const category of CATEGORIES) {
      aapTargets.push({
        office: office._id,
        financialYear: '2024-25',
        category,
        activityName: `${category} – ${office.city}`,
        annualTarget: rand(10, 50),
        unit: 'Nos',
        annualBudget: rand(500000, 5000000),
        quarter: {
          Q1: { target: rand(2, 12), budget: rand(100000, 1000000) },
          Q2: { target: rand(2, 12), budget: rand(100000, 1000000) },
          Q3: { target: rand(2, 12), budget: rand(100000, 1000000) },
          Q4: { target: rand(2, 12), budget: rand(100000, 1000000) },
        },
      });
    }
  }
  const createdTargets = await AAPTarget.insertMany(aapTargets);

  console.log('📋 Seeding Activities...');
  const activities = [];
  const now = new Date();
  for (const office of createdOffices) {
    const officeTargets = createdTargets.filter((t) => t.office.toString() === office._id.toString());
    for (let i = 0; i < rand(15, 40); i++) {
      const target = pick(officeTargets);
      const daysAgo = rand(0, 180);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      activities.push({
        office: office._id,
        date,
        category: target.category,
        activityName: target.activityName,
        description: `Activity conducted under ${target.category} programme.`,
        targetValue: rand(1, 10),
        achievedValue: rand(0, 10),
        unit: 'Nos',
        budget: rand(50000, 500000),
        expenditure: rand(0, 500000),
        status: pick(STATUSES),
        aapTarget: target._id,
      });
    }
  }
  await Activity.insertMany(activities);

  console.log('🔔 Seeding sample alerts...');
  await Alert.insertMany([
    {
      type: 'no_submission',
      severity: 'warning',
      title: 'No activity submission today',
      message: '5 offices have not submitted any activity for today.',
      autoGenerated: true,
    },
    {
      type: 'low_performance',
      severity: 'critical',
      title: 'Low completion rate alert',
      message: '3 offices are below 30% completion of annual targets.',
      autoGenerated: true,
    },
    {
      type: 'custom',
      severity: 'info',
      title: 'Q2 Review Meeting',
      message: 'Q2 performance review scheduled for all regional offices.',
      autoGenerated: false,
    },
  ]);

  console.log('\n✅ Seeding complete!');
  console.log('─────────────────────────────');
  console.log('Login credentials:');
  console.log('  Super Admin : admin@tourism.gov.in     / Admin@123');
  console.log('  Ministry    : ministry@tourism.gov.in  / Ministry@123');
  console.log('  Office Admin: admin.del@tourism.gov.in / Office@123 (pattern)');
  console.log('─────────────────────────────');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
