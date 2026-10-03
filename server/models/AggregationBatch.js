const mongoose = require('mongoose');

// A group of logistics requests sharing origin + destination region, moved
// together on one vehicle.
const aggregationBatchSchema = new mongoose.Schema({
  pickupRegion: { type: String, required: true },
  destinationRegion: { type: String, required: true },
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LogisticsRequest' }],
  totalQuantityKg: { type: Number, required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportProvider' },
  status: { type: String, enum: ['Open', 'Assigned', 'In Transit', 'Delivered', 'Cancelled'], default: 'Open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AggregationBatch', aggregationBatchSchema);
