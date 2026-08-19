const Order = require('../models/Order');

const createNewOrder = async (orderData) => await Order.create(orderData);

module.exports = { createNewOrder };