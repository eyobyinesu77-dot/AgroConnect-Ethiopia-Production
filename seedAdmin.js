const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agroconnect');

    console.log('MongoDB Connected for Seeding...');

    const existingAdmin = await User.findOne({ email: 'adminagro@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists with this email!');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@12', salt);

    const adminUser = new User({
      fullName: 'System Admin',
      name: 'System Admin',
      email: 'adminagro@gmail.com',
      password: hashedPassword,
      role: 'admin',
      region: 'Admin Region',
      zone: 'Admin Zone',
      woreda: 'Admin Woreda',
      phone: '+251999999999', // Unique phone number to prevent null duplicate key errors
      isVerified: true
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: adminagro@gmail.com');
    console.log('Password: Admin@12');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();

