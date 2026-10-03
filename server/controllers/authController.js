const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ETHIOPIAN_PHONE_REGEX, SELF_REGISTER_PHONE_REGEX, normalizePhone } = require('../utils/phoneValidation');
const { createToken, hashToken } = require('../utils/tokenUtils');
const sendEmailOptions = require('../utils/sendEmail');
const { verificationEmail, resetPasswordEmail } = require('../utils/emailTemplates');

const { getClientUrl } = require('../utils/clientUrl');
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000; // 1 hour

// Sends the verification email for a freshly created/updated user and
// persists the (hashed) token + expiry on that user document. Throws if
// sending fails — callers decide whether that should block the caller's
// own response (resendVerification does; registerUser deliberately does
// not, so an SMTP outage never blocks account creation — see its call site).
const issueVerificationEmail = async (user) => {
  // Resolved first: in production this throws if the frontend URL is unset or
  // points at localhost, before any token is stored for an email never sent.
  const clientUrl = getClientUrl();
  const { rawToken, hashedToken, expires } = createToken(EMAIL_VERIFICATION_TTL_MS);
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expires;
  await user.save();

  const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}`;
  const { subject, message, html } = verificationEmail(verifyUrl);
  await sendEmailOptions({ email: user.email, subject, message, html });
};

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
    const { password, role } = req.body;
    // Normalized consistently, here and at every other lookup point
    // (login, forgot-password, resend-verification), so "Test@x.com" and
    // "test@x.com" are always treated as the same account.
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
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
    // Exactly 10 digits, starting with 07 or 09 — no +251 prefix, no
    // spaces. Enforced here AND on the frontend (utils/validation.js);
    // the frontend check is only a convenience, this one is authoritative.
    if (!SELF_REGISTER_PHONE_REGEX.test(phone)) {
      return res.status(400).json({ message: 'Phone number must start with 07 or 09 and contain exactly 10 digits (e.g. 0912345678).' });
    }

    // Check email and phone for existing accounts up front so we can give
    // a specific, correct message for each — and 409 Conflict rather than
    // 400 Bad Request, since the request itself was well-formed.
    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ phone }),
    ]);
    if (phoneExists) {
      return res.status(409).json({ message: 'This phone number is already registered.' });
    }
    if (emailExists) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // At registration, we only set email, password, phone, and role.
    // fullName is not collected during registration.
    // Address (region, zone, woreda, kebele) and fayidaId are filled during profile completion.
    const user = await User.create({
      email,
      phone,
      role,
      password: hashedPassword,
      // fullName, address fields, and fayidaId will be null until profile completion
    });

    // An SMTP outage should never block account creation — the user can
    // always use "resend verification email" once mail is working again.
    // (Unlike resendVerification below, a failure here is not reported to
    // the client as an error, since registration itself did succeed.)
    try {
      await issueVerificationEmail(user);
    } catch (err) {
      console.error(`❌ Failed to send verification email to ${user.email}:`, err.message);
    }

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    // Fallback safety net: a race condition between the findOne checks
    // above and this insert (two requests for the same email/phone
    // arriving at nearly the same time) can still hit MongoDB's unique
    // index. Convert that into the same clean 409 response rather than a
    // generic 500, instead of relying solely on the pre-check above.
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      const message = field === 'phone'
        ? 'This phone number is already registered.'
        : 'This email is already registered.';
      return res.status(409).json({ message });
    }
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      user.lastLoginAt = new Date();
      await user.save();

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
        isEmailVerified: !!user.isEmailVerified,
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

// POST /api/auth/forgot-password  { email }
//
// Anti-enumeration: an unknown email and a successfully-sent email return the
// SAME 200 status and the SAME message, so neither the status nor the body
// reveals whether an account exists.
//
// Honesty: 200 is returned for a registered account ONLY after Nodemailer
// resolved (SMTP accepted the recipient). A real send failure is a 500 and is
// logged server-side with the underlying SMTP error.
//
// Server misconfiguration (frontend URL / SMTP settings) is checked BEFORE the
// user lookup so it fails identically for every email and doesn't double as an
// account-existence oracle.
const GENERIC_RESET_RESPONSE = {
  message: 'If that email is registered, a password reset link has been sent.',
};

const forgotPassword = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required.' });
    }

    let clientUrl;
    try {
      clientUrl = getClientUrl();
      if (!sendEmailOptions.isConfigured()) {
        throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASS are not all set.');
      }
    } catch (configErr) {
      console.error('❌ Password reset unavailable (server configuration):', configErr.message);
      return res.status(500).json({ message: 'The reset email could not be sent right now. Please try again later.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json(GENERIC_RESET_RESPONSE);
    }

    const { rawToken, hashedToken, expires } = createToken(RESET_PASSWORD_TTL_MS);
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
    const { subject, message, html } = resetPasswordEmail(resetUrl);
    try {
      const info = await sendEmailOptions({ email: user.email, subject, message, html });
      console.log(`✅ Password reset email accepted by SMTP for user ${user._id} (messageId ${info.messageId})`);
    } catch (err) {
      // The account exists and the email genuinely was not sent — say so
      // instead of reporting success. The real SMTP error is logged here.
      console.error(`❌ Failed to send password reset email for user ${user._id}:`, err);
      return res.status(500).json({ message: 'The reset email could not be sent right now. Please try again later.' });
    }

    res.status(200).json(GENERIC_RESET_RESPONSE);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password  { token, newPassword }
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const hashedToken = hashToken(token.trim());
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'This password reset link is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/verify-email/:token, GET /api/auth/verify-email?token=...
// (also accepts POST { token })
const verifyEmail = async (req, res) => {
  try {
    const token = req.params.token || req.query.token || req.body.token;
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

    res.status(200).json({ message: 'Email verified successfully.', isEmailVerified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/resend-verification  { email }
const resendVerification = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    // Same anti-enumeration approach as forgotPassword for the "no such
    // account, or already verified" case — but same as forgotPassword, an
    // actual send failure for a real, unverified account is reported as a
    // real error below, not folded into this generic response.
    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        message: 'If that email is registered and not yet verified, a new verification link has been sent.',
      });
    }

    try {
      await issueVerificationEmail(user);
    } catch (err) {
      console.error(`❌ Failed to resend verification email to ${user.email}:`, err);
      return res.status(500).json({ message: 'The verification email could not be sent right now. Please try again later.' });
    }

    res.status(200).json({ message: 'A new verification link has been sent to your email.' });
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
