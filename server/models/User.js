const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String },  // Optional — not collected at registration
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: {
    type: String,
    trim: true,
    // unique + sparse: a duplicate phone is rejected at the DB level too,
    // as a safety net alongside the explicit check in authController.js
    // (sparse so admin accounts, which have no phone, don't collide on
    // multiple nulls).
    unique: true,
    sparse: true,
    required: function () {
      return this.role === 'farmer' || this.role === 'buyer' || this.role === 'extension';
    }
  },
  role: { type: String, enum: ['admin', 'farmer', 'buyer', 'extension'], default: 'farmer' },
  // Address fields: collected during registration for admin/extension,
  // during profile completion for farmers, optional for buyers
  region: { type: String },
  zone: { type: String },
  woreda: { type: String },
  kebele: { type: String },
  fayidaId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  primaryCrop: { type: String },
  farmSize: { type: Number },
  farmLocation: { type: String },
  mustChangePassword: { type: Boolean, default: false },
  // Updated on every successful login — powers the Admin Analytics
  // "active users" metric (PRD-054). Optional/undefined for accounts that
  // have never logged in since this field was added.
  lastLoginAt: { type: Date },
  // Email verification. Existing accounts created before this field existed
  // (e.g. the seeded admin) default to false via Mongoose's schema default,
  // but login is intentionally NOT blocked on this (see authController) so
  // no existing user is locked out by this migration.
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  // Forgot/reset password
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Only meaningful when role === 'farmer'. The specific Extension Worker
  // responsible for this farmer — assigned by an Admin (see
  // adminController.assignExtensionWorker). Nullable: a farmer can exist
  // with no assignment yet. This is the real Farmer <-> Extension Worker
  // relationship that was previously missing — role-level Farmer<->Extension
  // messaging (any farmer can message any extension worker) is unchanged
  // and intentionally still not gated by this field; this field is used
  // for extensionController.getFarmersList (an extension worker's own
  // farmer roster) and for future features that need a specific pairing.
  assignedExtensionWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);