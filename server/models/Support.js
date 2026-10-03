const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional — guests can also submit
  guestName: { type: String, trim: true },
  guestEmail: { type: String, trim: true },
  phone: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Technical Issue', 'Payment Issue', 'General Inquiry'],
    required: true,
  },
  language: {
    type: String,
    enum: ['Amharic', 'English'],
    default: 'English',
  },
  message: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['New', 'Read', 'Replied', 'Archived'],
    default: 'New',
  },
  // Admin reply to public message
  adminReply: {
    content: { type: String, trim: true },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Admin who replied
    repliedAt: { type: Date },
  },
}, { timestamps: true });

supportSchema.index({ user: 1 });

module.exports = mongoose.model('Support', supportSchema);
