const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String },  // Optional — not collected at registration
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: {
    type: String,
    trim: true,
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