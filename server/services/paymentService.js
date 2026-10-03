const Payment = require('../models/Payment');

const processPaymentService = async (paymentData) => await Payment.create(paymentData);

module.exports = { processPaymentService };