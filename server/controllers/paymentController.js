const axios = require('axios');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { notifyUser } = require('../utils/notify');
const { getUploadedFileUrl } = require('../utils/fileUrl');

// Payment methods supported in this MVP.
const ONLINE_METHODS = ['Telebirr', 'Chapa'];
const ALLOWED_METHODS = ['Cash on Delivery', ...ONLINE_METHODS];

// --- Chapa integration -----------------------------------------------------
// Real integration, gated behind an environment variable so the app still
// works out of the box for a demo without any keys configured.
//
// Set CHAPA_SECRET_KEY in server/.env (get one from https://dashboard.chapa.co)
// to switch this from simulated to a real "initialize transaction" call
// against Chapa's documented REST API. This has NOT been exercised against
// Chapa's live/test servers in this environment (no network access here) —
// test it yourself with a Chapa test secret key before relying on it.
//
// Chapa's real flow is actually two steps, not one:
//   1. POST /v1/transaction/initialize  → returns a checkout_url
//   2. The buyer is redirected to checkout_url to enter card/mobile details
//   3. Chapa calls your webhook (or you poll GET /v1/transaction/verify/:tx_ref)
//      to confirm the payment actually succeeded
// A single request/response, as this function currently returns, can only
// ever cover step 1. Marking the order "Paid" immediately after step 1 (as
// this simulation does) is NOT safe for production — do that only after a
// verified webhook/verify call confirms the transaction.
const initializeChapaPayment = async ({ order, user }) => {
  const secretKey = process.env.CHAPA_SECRET_KEY;

  if (!secretKey) {
    // No key configured — fall back to the simulated instant-success flow.
    return { simulated: true, status: 'Success' };
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

    const isCashOnDelivery = paymentMethod === 'Cash on Delivery';
    let checkoutUrl = null;
    let paymentStatus = 'Pending';

    if (isCashOnDelivery) {
      paymentStatus = 'Pending'; // settled by the courier on delivery
    } else if (paymentMethod === 'Chapa') {
      const result = await initializeChapaPayment({ order, user: req.user });
      paymentStatus = result.status;
      checkoutUrl = result.checkoutUrl || null;
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
          : isCashOnDelivery
          ? 'Cash on Delivery selected — you will pay upon delivery.'
          : 'Payment started — please continue.',
      payment,
      order,
      checkoutUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.response?.data?.message || error.message });
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
    const { tx_ref } = req.body;
    if (!secretKey || !tx_ref) {
      return res.status(400).json({ message: 'Missing tx_ref or Chapa is not configured.' });
    }

    const verifyRes = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (verifyRes.data?.data?.status !== 'success') {
      return res.status(200).json({ message: 'Payment not yet successful, ignoring.' });
    }

    // tx_ref was constructed as `agroconnect-<orderId>-<timestamp>` in initializeChapaPayment.
    const orderId = tx_ref.split('-')[1];
    const order = await Order.findById(orderId);
    if (order && order.paymentStatus !== 'Paid') {
      order.paymentStatus = 'Paid';
      await order.save();
      await Payment.findOneAndUpdate({ order: order._id, paymentMethod: 'Chapa' }, { status: 'Success' });
    }

    res.status(200).json({ message: 'Webhook processed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      url: getUploadedFileUrl(req),  // Cloudinary URL from multer middleware
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
