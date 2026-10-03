const mongoose = require('mongoose');

const REQUEST_STATUSES = ['Pending', 'Batched', 'Assigned', 'In Transit', 'Delivered', 'Cancelled'];
const UNITS = ['Quintal', 'Kg', 'Liter'];

// A farmer's or buyer's request to have goods transported (PRD: Logistics
// Request). Pending requests with the same origin/destination region can be
// grouped into an AggregationBatch so one vehicle carries several smallholders'
// loads (PRD: Logistics & Aggregation Matching).
const logisticsRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional link to a listing
  cropName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, enum: UNITS, default: 'Quintal' },
  quantityKg: { type: Number, required: true }, // normalised so requests are comparable
  pickupRegion: { type: String, required: true, trim: true },
  pickupZone: { type: String, trim: true },
  pickupWoreda: { type: String, trim: true },
  destinationRegion: { type: String, required: true, trim: true },
  destinationAddress: { type: String, required: true, trim: true },
  preferredDate: { type: Date },
  notes: { type: String, trim: true },
  status: { type: String, enum: REQUEST_STATUSES, default: 'Pending' },
  assignedProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportProvider' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'AggregationBatch' },
}, { timestamps: true });

logisticsRequestSchema.index({ requester: 1 });
logisticsRequestSchema.index({ status: 1, pickupRegion: 1, destinationRegion: 1 });

logisticsRequestSchema.statics.STATUSES = REQUEST_STATUSES;
logisticsRequestSchema.statics.UNITS = UNITS;

module.exports = mongoose.model('LogisticsRequest', logisticsRequestSchema);
