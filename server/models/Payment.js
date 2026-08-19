const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['Success', 'Failed', 'Pending'], default: 'Pending' },
  // Telebirr screenshot for manual payment verification
  proofOfPayment: {
    url: { type: String },  // Cloudinary URL of uploaded screenshot
    uploadedAt: { type: Date },
  },
  // The Telebirr transaction ID the buyer typed in alongside the screenshot.
  // unique+sparse: a given transaction ID can only ever be attached to one
  // payment on the platform (the "reused screenshot" fraud check), while
  // still allowing unlimited Cash on Delivery / Chapa payments that never
  // set this field at all.
  transactionId: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
}, { timestamps: true });

paymentSchema.index({ user: 1 });
paymentSchema.index({ order: 1 });

module.exports = mongoose.model('Payment', paymentSchema);