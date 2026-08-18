const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalPrice: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
  paymentMethod: { type: String }
}, { timestamps: true });

// `buyer` — every "my orders" lookup; `orderItems.product` — every
// farmer-orders lookup (finds orders containing any of a farmer's products).
orderSchema.index({ buyer: 1 });
orderSchema.index({ 'orderItems.product': 1 });

module.exports = mongoose.model('Order', orderSchema);