const axios = require('axios');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { notifyUser } = require('../utils/notify');

// The only payment methods the API accepts. Anything else (including the
// retired Cash on Delivery option) is rejected with a 400 below.
const ALLOWED_METHODS = ['Chapa', 'Telebirr'];

// --- Chapa integration -----------------------------------------------------
// Uses Chapa's transaction initialization API and requires CHAPA_SECRET_KEY.
// Initialization creates a Pending payment; it does not mean the buyer has paid.
// The buyer completes checkout at Chapa, and the public callback handler
// independently verifies the transaction with Chapa before marking it Paid.
// Configure CHAPA_CALLBACK_URL and CLIENT_URL in the deployment environment.
// Test with Chapa test credentials before relying on the integration in production.
const initializeChapaPayment = async ({ order, user }) => {
  const secretKey = process.env.CHAPA_SECRET_KEY;

  if (!secretKey) {
    const error = new Error('Chapa payments are unavailable: CHAPA_SECRET_KEY is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const tx_ref = `agroconnect-${order._id}-${Date.now()}`;
  const response = await axios.post(
    'https://api.chapa.co/v1/transaction/initialize',
    {
      amount: order.totalPrice,
      currency: 'ETB',
      email: user.email,
      first_name: user.fullName?.split(' ')[0] || 'Buyer',
      tx_ref,
      callback_url: process.env.CHAPA_CALLBACK_URL,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/buyer/orders`,
    },
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );

  return {
    simulated: false,
    status: 'Pending', // Real payment is not confirmed until the webhook/verify step.
    tx_ref,
    checkoutUrl: response.data?.data?.checkout_url,
  };
};

// POST /api/payments/pay — buyer pays (or retries payment) for one of their own orders
const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ message: 'orderId and paymentMethod are required.' });
    }
    if (!ALLOWED_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: `paymentMethod must be one of: ${ALLOWED_METHODS.join(', ')}` });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay for your own orders.' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'This order was cancelled and can no longer be paid.' });
    }
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'This order has already been paid.' });
    }

    let checkoutUrl = null;
    let txRef = null;
    let paymentStatus = 'Pending';

    if (paymentMethod === 'Chapa') {
      const result = await initializeChapaPayment({ order, user: req.user });
      paymentStatus = result.status;
      checkoutUrl = result.checkoutUrl || null;
      txRef = result.tx_ref || null;
    } else {
      // Telebirr has no publicly documented self-serve sandbox API — this
      // stays simulated until a real merchant integration is set up with
      // Ethio Telecom directly. But buyers can upload a payment screenshot
      // for manual verification by the farmer.
      paymentStatus = 'Pending';  // Awaiting farmer verification
    }

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: order.totalPrice,
      paymentMethod,
      status: paymentStatus,
      ...(paymentMethod === 'Chapa' && txRef ? { tx_ref: txRef } : {}),
    });

    order.paymentMethod = paymentMethod;
    if (paymentStatus === 'Success') {
      order.paymentStatus = 'Paid';
    }
    await order.save();

    if (paymentStatus === 'Success') {
      const orderWithItems = await Order.findById(order._id).populate('orderItems.product', 'farmer name');
      const notifiedFarmers = new Set();
      for (const item of orderWithItems.orderItems) {
        if (!item.product) continue;
        const farmerId = item.product.farmer.toString();
        if (!notifiedFarmers.has(farmerId)) {
          notifiedFarmers.add(farmerId);
          notifyUser(item.product.farmer, `Payment received for an order including "${item.product.name}"`);
        }
      }
    }

    res.status(201).json({
      message:
        paymentStatus === 'Success'
          ? 'Payment completed successfully!'
          : 'Payment started — please continue.',
      payment,
      order,
      checkoutUrl,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.response?.data?.message || error.message });
  }
};

// GET /api/payments/mine — the logged-in buyer's own payment history
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('order', 'totalPrice status')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments — admin: every payment on the platform
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'fullName email')
      .populate('order', 'totalPrice status')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/chapa-webhook — Chapa calls this after a transaction completes.
// We re-verify with Chapa's own /verify endpoint rather than trusting the webhook
// body directly, since webhook payloads can be spoofed if the URL leaks.
const chapaWebhook = async (req, res) => {
  try {
    const secretKey = process.env.CHAPA_SECRET_KEY;
    const tx_ref = req.body && req.body.tx_ref;

    if (!secretKey || !tx_ref || typeof tx_ref !== 'string') {
      return res.status(400).json({ message: 'Missing tx_ref or Chapa is not configured.' });
    }

    // Match the exact Chapa transaction recorded during initialization.
    const payment = await Payment.findOne({ tx_ref, paymentMethod: 'Chapa' });
    if (!payment) {
      return res.status(404).json({ message: 'Chapa transaction reference was not found.' });
    }

    const verifyRes = await axios.get(
      'https://api.chapa.co/v1/transaction/verify/' + encodeURIComponent(tx_ref),
      { headers: { Authorization: 'Bearer ' + secretKey } }
    );
    const verified = verifyRes.data && verifyRes.data.data;

    if (
      !verified ||
      String(verified.status || '').toLowerCase() !== 'success' ||
      verified.tx_ref !== tx_ref ||
      Number(verified.amount) !== Number(payment.amount) ||
      String(verified.currency || '').toUpperCase() !== 'ETB'
    ) {
      return res.status(200).json({ message: 'Chapa verification did not match the expected transaction.' });
    }

    const order = await Order.findById(payment.order);
    if (!order) {
      return res.status(404).json({ message: 'Order for this payment was not found.' });
    }
    if (order.paymentMethod !== 'Chapa') {
      return res.status(409).json({ message: 'Order payment method does not match this Chapa transaction.' });
    }
    if (order.status === 'Cancelled') {
      return res.status(409).json({ message: 'Cancelled orders cannot be marked paid.' });
    }

    if (order.paymentStatus !== 'Paid') {
      order.paymentStatus = 'Paid';
      await order.save();
    }
    if (payment.status !== 'Success') {
      payment.status = 'Success';
      await payment.save();
    }

    return res.status(200).json({ message: 'Chapa payment verified successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Telebirr transaction IDs are alphanumeric, typically 8-15 characters
// (e.g. "CI91A2B3C4"). This is deliberately permissive on length/format
// since Telebirr hasn't published a fixed spec — the real fraud check is
// the uniqueness lookup below, not the shape of the string.
const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9]{6,20}$/;

// POST /api/payments/:paymentId/telebirr-proof — buyer uploads Telebirr payment screenshot
const uploadTelebirrProof = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const rawTransactionId = (req.body.transactionId || '').trim();

    if (!req.file) {
      return res.status(400).json({ message: 'No screenshot uploaded.' });
    }
    if (!rawTransactionId) {
      return res.status(400).json({ message: 'Telebirr transaction ID is required.' });
    }
    if (!TRANSACTION_ID_PATTERN.test(rawTransactionId)) {
      return res.status(400).json({
        message: 'Transaction ID looks invalid — it should be 6-20 letters/numbers, as shown in your Telebirr SMS receipt.',
      });
    }
    const transactionId = rawTransactionId.toUpperCase();

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Only the buyer who made this payment can upload proof
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only upload proof for your own payments.' });
    }

    // Only Telebirr payments need screenshot proof
    if (payment.paymentMethod !== 'Telebirr') {
      return res.status(400).json({ message: 'Only Telebirr payments require screenshot proof.' });
    }

    // Fraud check: this exact transaction ID must not already be attached
    // to a different payment (a buyer re-submitting a screenshot for THIS
    // same payment with the same ID is fine — that's not a reused ID).
    const existing = await Payment.findOne({
      transactionId,
      _id: { $ne: payment._id },
    });
    if (existing) {
      return res.status(409).json({
        message: 'This Telebirr transaction ID has already been used for a different payment. Please double-check your receipt.',
      });
    }

    // Update payment with proof image, transaction ID, and a timestamp —
    // the timestamp is set server-side (never trusts a client-supplied
    // date) so it reflects the moment of upload, not anything embedded in
    // the image itself.
    payment.proofOfPayment = {
      url: req.file.path,  // Cloudinary URL from multer middleware
      uploadedAt: new Date(),
    };
    payment.transactionId = transactionId;
    payment.status = 'Pending';  // Awaiting farmer verification
    await payment.save();

    // Notify the farmer(s) that payment proof was uploaded
    const order = await Order.findById(payment.order).populate('orderItems.product', 'farmer name');
    const notifiedFarmers = new Set();
    for (const item of order.orderItems) {
      if (!item.product) continue;
      const farmerId = item.product.farmer.toString();
      if (!notifiedFarmers.has(farmerId)) {
        notifiedFarmers.add(farmerId);
        notifyUser(
          item.product.farmer,
          `Payment proof uploaded for order ${order._id.toString().slice(-6)}. Please verify the Telebirr screenshot.`
        );
      }
    }

    res.json({
      message: 'Screenshot uploaded successfully. Farmer will verify your payment.',
      payment,
    });
  } catch (error) {
    // Race-condition fallback: two near-simultaneous uploads with the same
    // transaction ID could both pass the findOne check above before either
    // save() commits. The unique index is the real guarantee; this just
    // turns that low-level Mongo error into the same clean message.
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This Telebirr transaction ID has already been used for a different payment. Please double-check your receipt.',
      });
    }
    console.error('Telebirr proof upload error:', error.message);
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
};

module.exports = { processPayment, getMyPayments, getAllPayments, chapaWebhook, uploadTelebirrProof };
