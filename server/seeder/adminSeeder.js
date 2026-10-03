// One-time script to create the initial Admin account.
// Admin accounts are never created through the public /api/auth/register endpoint.
//
// Usage:
//   cd server
//   node seeder/adminSeeder.js
//
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from server/.env (with sensible defaults
// if not set). Safe to run multiple times — it will skip creation if an admin
// with that email already exists.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@agroconnect.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@AgroConnect2026';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`ℹ️  Admin account already exists for ${email}. Nothing to do.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      fullName: 'System Administrator',
      email,
      password: hashedPassword,
      role: 'admin',
      region: 'Addis Ababa',
      zone: 'Addis Ababa',
      woreda: 'N/A',
    });

    console.log('🎉 Admin account created successfully:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   Please log in and consider changing this password.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin account:', error.message);
    process.exit(1);
  }
};

run();
