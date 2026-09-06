const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { ETHIOPIAN_PHONE_REGEX, normalizePhone } = require('../utils/phoneValidation');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// The raw token is what goes in the email/URL and is shown to the user
// exactly once. Only its SHA-256 hash is ever stored in MongoDB, so a
// database leak alone can never be used to reset an account's password or
// forge an email verification.
const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

const sendVerificationEmail = async (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = hashToken(rawToken);
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  await user.save();

  const verifyUrl = `${getFrontendUrl()}/verify-email?token=${rawToken}`;
  await sendEmail({
    email: user.email,
    subject: 'AgroConnect Ethiopia - Verify Your Email',
    message:
      `Welcome to AgroConnect Ethiopia!\n\n` +
      `Please verify your email address by clicking the link below:\n${verifyUrl}\n\n` +
      `This link expires in 24 hours. If you did not create this account, you can ignore this email.`,
  });
};

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

    // Fire off the real verification email, but never let an SMTP outage
    // block registration itself — the account is already created and valid
    // for login at this point. isEmailVerified simply stays false until the
    // user completes the link (or uses resend-verification).
    try {
      await sendVerificationEmail(user);
    } catch (emailError) {
      console.error(`Verification email failed to send to ${user.email}:`, emailError.message);
    }

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

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });

    // Account-enumeration protection: the response is identical whether or
    // not the email is registered. Only the branch below (user exists)
    // actually generates a token and sends anything.
    const genericResponse = {
      message: 'If that email is registered, a password reset link has been sent.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${rawToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'AgroConnect Ethiopia - Password Reset Request',
        message:
          `You requested a password reset for your AgroConnect Ethiopia account.\n\n` +
          `Click the link below to choose a new password:\n${resetUrl}\n\n` +
          `This link expires in 1 hour. If you did not request this, you can safely ignore this email — your password will not be changed.`,
      });
    } catch (emailError) {
      // Don't leave a live, unusable reset token sitting in the DB if the
      // email that was supposed to deliver it never went out.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      console.error(`Password reset email failed to send to ${user.email}:`, emailError.message);
      return res.status(500).json({ message: 'Could not send the reset email. Please try again later.' });
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Your password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ message: 'This verification link is invalid or has expired.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Your email has been verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    const genericResponse = {
      message: 'If that email is registered and not yet verified, a new verification link has been sent.',
    };

    // Same account-enumeration protection as forgot-password, plus: don't
    // send a fresh token to an already-verified account.
    if (!user || user.isEmailVerified) {
      return res.status(200).json(genericResponse);
    }

    try {
      await sendVerificationEmail(user);
    } catch (emailError) {
      console.error(`Resend verification email failed for ${user.email}:`, emailError.message);
      return res.status(500).json({ message: 'Could not send the verification email. Please try again later.' });
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
