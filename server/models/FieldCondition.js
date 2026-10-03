const mongoose = require('mongoose');

// A crop/field/disease-pest condition report an extension worker files for
// a specific farmer (not broadcast to a region like WeatherAdvisory/Advice
// — this is farm-specific, so it targets one farmer directly, the same
// pattern already used by the Visit model). conditionType distinguishes
// the three related concerns the spec calls for (crop condition, disease/
// pest situation, general field condition) without needing three nearly
// identical models.
const fieldConditionSchema = new mongoose.Schema({
  extensionWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conditionType: {
    type: String,
    enum: ['Crop Condition', 'Disease/Pest', 'Field Condition'],
    required: true,
  },
  cropType: { type: String }, // optional — e.g. "Teff", "Maize"
  description: { type: String, required: true },
  recommendation: { type: String },
}, { timestamps: true });

fieldConditionSchema.index({ farmer: 1 });
fieldConditionSchema.index({ extensionWorker: 1 });

module.exports = mongoose.model('FieldCondition', fieldConditionSchema);
