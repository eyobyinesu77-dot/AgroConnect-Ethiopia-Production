const mongoose = require('mongoose');

const requestPortionSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LogisticsRequest',
      required: true,
    },
    quantityKg: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { _id: false }
);

const transportAllocationSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportProvider',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AggregationBatch',
    },
    requestPortions: {
      type: [requestPortionSchema],
      required: true,
      validate: {
        validator(portions) {
          return Array.isArray(portions) && portions.length > 0;
        },
        message: 'An allocation must include at least one request portion.',
      },
    },
    totalQuantityKg: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ['Assigned', 'In Transit', 'Delivered', 'Cancelled'],
      default: 'Assigned',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

transportAllocationSchema.index({ provider: 1, status: 1 });
transportAllocationSchema.index({ 'requestPortions.request': 1 });
transportAllocationSchema.index({ batch: 1, status: 1 });

module.exports = mongoose.model(
  'TransportAllocation',
  transportAllocationSchema
);
