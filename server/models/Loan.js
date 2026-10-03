const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  bankType: { type: String, required: true },
  duration: { type: String, required: true },
  // Cloudinary-hosted URL of the uploaded crop-type photo (see
  // uploadMiddleware's cropImage field + config/cloudinary.js). Optional —
  // not every applicant will have a photo on hand.
  cropImage: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

loanSchema.index({ farmer: 1 });

module.exports = mongoose.model('Loan', loanSchema);