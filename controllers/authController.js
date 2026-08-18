const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ETHIOPIAN_PHONE_REGEX, normalizePhone } = require('../utils/phoneValidation');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Fayida (national) ID must be exactly 13 numeric digits
const FAYIDA_ID_REGEX = /^\d{13}$/;

// Only farmers and buyers may self-register.
// Admin accounts are created only via the seeder / directly in the database.
// Extension worker accounts are created only by an admin (see adminController.createExtensionWorker).
const ALLOWED_SELF_REGISTER_ROLES = ['farmer', 'buyer'];

const registerUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (!ALLOWED_SELF_REGISTER_ROLES.includes(role)) {
      return res.status(403).json({
        message: 'Only farmers and buyers can self-register. Admin and Extension Worker accounts are created by an administrator.',
      });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
    if (!ETHIOPIAN_PHONE_REGEX.test(phone)) {
      return res.status(400).json({ message: 'Please provide a valid Ethiopian phone number (e.g. 09xxxxxxxx or +2519xxxxxxxx).' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'This email is already registered!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // At registration, we only set email, password, phone, and role.
    // fullName is not collected during registration.
    // Address (region, zone, woreda, kebele) and fayidaId are filled during profile completion.
    const user = await User.create({
      email: req.body.email,
      phone,
      role,
      password: hashedPassword,
      // fullName, address fields, and fayidaId will be null until profile completion
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        region: user.region,
        zone: user.zone,
        woreda: user.woreda,
        kebele: user.kebele,
        fayidaId: user.fayidaId,
        mustChangePassword: !!user.mustChangePassword,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Incorrect email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, changePassword };
