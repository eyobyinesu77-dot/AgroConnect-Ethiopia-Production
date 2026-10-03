const mongoose = require('mongoose');

const VEHICLE_TYPES = ['Pickup', 'Isuzu Truck', 'Heavy Truck', 'Minibus', 'Motorbike/Tricycle', 'Animal Cart'];

// Directory entry for a transport provider (PRD: Transport Provider
// Directory). Managed by admins; browsable by farmers and buyers.
const transportProviderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
  // Max load in kilograms (1 quintal = 100 kg).
  capacityKg: { type: Number, required: true, min: 1 },
  // Regions this provider operates in (matched against pickup/destination regions).
  regionsServed: [{ type: String, trim: true }],
  // Indicative rate; optional. ETB per quintal per km is easy for farmers to compare.
  ratePerQuintalPerKm: { type: Number, min: 0 },
  isAvailable: { type: Boolean, default: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

transportProviderSchema.index({ regionsServed: 1, isAvailable: 1 });
transportProviderSchema.statics.VEHICLE_TYPES = VEHICLE_TYPES;

module.exports = mongoose.model('TransportProvider', transportProviderSchema);
