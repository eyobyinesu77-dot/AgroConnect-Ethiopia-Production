const mongoose = require('mongoose');

// A training session an extension worker schedules for farmers in their
// region (optionally narrowed to a zone), e.g. "Soil conservation workshop".
const trainingSchema = new mongoose.Schema({
  extensionWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  region: { type: String, required: true },
  zone: { type: String },
  // Optional explicit farmer targeting alongside the region/zone broadcast
  // above — see Advice.js for the identical pattern and rationale.
  targetFarmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

trainingSchema.index({ region: 1, zone: 1 });
trainingSchema.index({ extensionWorker: 1 });

module.exports = mongoose.model('Training', trainingSchema);
