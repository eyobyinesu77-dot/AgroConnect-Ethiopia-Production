const mongoose = require('mongoose');

// A weather advisory manually posted by an extension worker, distinct from
// the live API-driven forecast in weatherController.js. Extension workers
// know their assigned farmers and local conditions on the ground, so this
// is a separate feed farmers see alongside (not instead of) the live
// weather — e.g. "heavy rain expected this weekend, delay fertilizer
// application."
const weatherAdvisorySchema = new mongoose.Schema({
  extensionWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  // Target audience: farmers in this region are shown the advisory. Zone
  // and woreda are both optional and narrow it further within the region —
  // set one or the other (or neither, to reach the whole region).
  region: { type: String, required: true },
  zone: { type: String },
  woreda: { type: String },
  condition: { type: String, required: true }, // e.g. "Heavy Rain", "Drought Risk", "Clear Skies"
  message: { type: String, required: true },
  // Optional explicit farmer targeting alongside the region/zone/woreda
  // broadcast above — see Advice.js for the identical pattern and rationale.
  targetFarmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

weatherAdvisorySchema.index({ region: 1, zone: 1, woreda: 1 });
weatherAdvisorySchema.index({ extensionWorker: 1 });

module.exports = mongoose.model('WeatherAdvisory', weatherAdvisorySchema);
