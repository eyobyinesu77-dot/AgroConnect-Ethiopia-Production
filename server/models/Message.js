const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Every conversation-thread lookup queries by (sender, recipient) in both
// directions — this compound index covers that pattern.
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
