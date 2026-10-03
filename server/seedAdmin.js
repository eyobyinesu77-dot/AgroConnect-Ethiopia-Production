/**
 * Legacy one-shot admin seeder. Prefer: npm run seed:admin (seeder/adminSeeder.js)
 * which reads ADMIN_EMAIL / ADMIN_PASSWORD from .env.
 *
 * This script now also uses env vars and will not print the password.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agroconnect');
    console.log('MongoDB Connected for Seeding...');

    const email = process.env.ADMIN_EMAIL || 'admin@agroconnect.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@AgroConnect2026';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin user already exists for ${email}. Nothing to do.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      fullName: 'System Admin',
      email,
      password: hashedPassword,
      role: 'admin',
      region: 'Addis Ababa',
      zone: 'Addis Ababa',
      woreda: 'N/A',
    });

    console.log('Admin user created successfully.');
    console.log(`Email: ${email}`);
    console.log('Password: (from ADMIN_PASSWORD env or default — change after first login)');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
