const mongoose = require('mongoose');

// Agricultural advice posted by an extension worker for farmers to read —
// e.g. crop care tips, soil management guidance. Optionally targeted at a
// specific crop type and/or narrowed to a zone within the worker's region,
// same targeting pattern as WeatherAdvisory.
const adviceSchema = new mongoose.Schema({
  extensionWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  cropType: { type: String }, // optional — e.g. "Teff", "Maize"; blank = general advice
  region: { type: String, required: true },
  zone: { type: String },
  // Optional explicit farmer targeting, alongside the region/zone broadcast
  // above. When set, these specific farmers see the advice regardless of
  // whether it also matches their region/zone (see the $or in
  // getAdviceForFarmer) — lets an extension worker target a hand-picked
  // farmer or set of farmers instead of (or in addition to) an area.
  targetFarmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

adviceSchema.index({ region: 1, zone: 1 });
adviceSchema.index({ extensionWorker: 1 });

module.exports = mongoose.model('Advice', adviceSchema);
