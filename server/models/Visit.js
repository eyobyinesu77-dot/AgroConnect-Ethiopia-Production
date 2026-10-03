const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  extensionWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, required: true },
  visitDate: { type: Date, default: Date.now }
}, { timestamps: true });

visitSchema.index({ extensionWorker: 1 });

module.exports = mongoose.model('Visit', visitSchema);