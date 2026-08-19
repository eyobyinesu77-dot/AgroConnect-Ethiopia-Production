const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { notifyUser } = require('../utils/notify');

// Restores stock for items already decremented earlier in the same
// request, when a later item in the same order fails validation or the
// order fails to save — otherwise a failed order would still have
// permanently reduced stock for whichever items succeeded before the
// failure point.
const rollbackStock = async (decrementedItems) => {
  for (const item of decrementedItems) {
    try {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
        // Reverting a decrement means stock is no longer 0 — un-flip
        // Sold Out so the listing becomes purchasable again.
        $set: { listingStatus: 'Active' },
      });
    } catch (error) {
      console.error('Failed to roll back stock for product', item.product, ':', error.message);
    }
  }
};

// POST /api/orders — buyer places an order from their cart
const createOrder = async (req, res) => {
  const decrementedItems = []; // for rollback if a later step fails

  try {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: 'A delivery address is required.' });
    }

    let totalPrice = 0;
    const preparedItems = [];

    for (const item of orderItems) {
      // Reject zero/negative/non-numeric quantities up front — without
      // this, a negative quantity would pass the old "stock < quantity"
      // check (since stock is never less than a negative number) and then
      // *increase* stock via $inc, and would reduce totalPrice instead of
      // adding to it.
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        await rollbackStock(decrementedItems);
        return res.status(400).json({ message: 'Quantity must be a whole number greater than zero.' });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        await rollbackStock(decrementedItems);
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      // Atomic check-and-decrement in one operation: the update only
      // matches (and only applies) if stock is currently >= the requested
      // quantity. This closes the race window a separate "check stock"
      // then "decrement stock" pair would leave open — two concurrent
      // checkouts for the last few units can no longer both pass their
      // own check before either decrement lands.
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );
      if (!updated) {
        await rollbackStock(decrementedItems);
        // Re-fetch current stock for an accurate message (product.stock
        // above may be stale if another request changed it concurrently).
        const current = await Product.findById(item.product).select('stock');
        return res.status(400).json({ message: `Not enough stock for "${product.name}". Only ${current?.stock ?? 0} available.` });
      }

      decrementedItems.push({ product: item.product, quantity });

      if (updated.stock <= 0 && updated.listingStatus !== 'Sold Out') {
        updated.listingStatus = 'Sold Out';
        await updated.save();
      }

      preparedItems.push({
        product: product._id,
        quantity,
        price: product.price,
      });
      totalPrice += product.price * quantity;
    }

    let order;
    try {
      order = await Order.create({
        buyer: req.user._id,
        orderItems: preparedItems,
        totalPrice,
        shippingAddress,
      });
    } catch (orderError) {
      // Stock was already decremented for preparedItems — restore it
      // since no order was actually saved.
      await rollbackStock(decrementedItems);
      throw orderError;
    }

    // Notify each farmer whose product was included in this order.
    const productDocs = await Product.find({ _id: { $in: preparedItems.map((i) => i.product) } }).select('farmer name');
    const notifiedFarmers = new Set();
    for (const product of productDocs) {
      const farmerId = product.farmer.toString();
      if (!notifiedFarmers.has(farmerId)) {
        notifiedFarmers.add(farmerId);
        notifyUser(product.farmer, `New order received for "${product.name}" and possibly other items`);
      }
    }

    res.status(201).json({ message: 'Order created!', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetches the Payment for each of the given order ids and returns a Map
// keyed by order id, with just the fields the order-review UIs need
// (screenshot, transaction ID, and status) — shared by getMyOrders (buyer)
// and getFarmerOrders (farmer) so both sides of the "Incoming Orders" flow
// stay in sync with a single implementation.
const getPaymentInfoByOrderId = async (orderIds) => {
  const payments = await Payment.find({ order: { $in: orderIds } }).select(
    'order paymentMethod status proofOfPayment transactionId'
  );
  return new Map(
    payments.map((payment) => [
      payment.order.toString(),
      {
        _id: payment._id,
        paymentMethod: payment.paymentMethod,
        status: payment.status, // 'Pending' | 'Success' | 'Failed'
        proofOfPayment: payment.proofOfPayment || null, // { url, uploadedAt }
        transactionId: payment.transactionId || null,
      },
    ])
  );
};

// GET /api/orders/mine — the logged-in buyer's own orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('orderItems.product', 'name category')
      .sort({ createdAt: -1 });

    const paymentByOrderId = await getPaymentInfoByOrderId(orders.map((o) => o._id));
    const withPayment = orders.map((order) => ({
      ...order.toObject(),
      payment: paymentByOrderId.get(order._id.toString()) || null,
    }));

    res.json(withPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/farmer-orders — orders containing at least one of the logged-in farmer's products
const getFarmerOrders = async (req, res) => {
  try {
    const myProductIds = await Product.find({ farmer: req.user._id }).distinct('_id');

    const orders = await Order.find({ 'orderItems.product': { $in: myProductIds } })
      .populate('buyer', 'fullName phone region zone woreda')
      .populate('orderItems.product', 'name category farmer')
      .sort({ createdAt: -1 });

    // Pull in the Telebirr proof-of-payment screenshot (plus the payment's
    // id, status, and transaction ID) for each order in one extra query, so
    // the farmer's "Incoming Orders" list can show the screenshot and
    // cross-reference the transaction ID inline without a second round
    // trip per order.
    const paymentByOrderId = await getPaymentInfoByOrderId(orders.map((o) => o._id));

    // Only surface the line items that belong to this farmer within each order.
    const scoped = orders.map((order) => {
      const myItems = order.orderItems.filter(
        (item) => item.product && item.product.farmer?.toString() === req.user._id.toString()
      );
      return {
        _id: order._id,
        buyer: order.buyer,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        orderItems: myItems,
        myTotal: myItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        // Present only when a Payment record exists for this order (it
        // always will once the buyer has chosen a payment method).
        payment: paymentByOrderId.get(order._id.toString()) || null,
      };
    });

    res.json(scoped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:id/status — farmer updates the status of an order containing their product
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const order = await Order.findById(req.params.id).populate('orderItems.product', 'farmer');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const ownsAnItem = order.orderItems.some(
      (item) => item.product && item.product.farmer?.toString() === req.user._id.toString()
    );
    if (req.user.role !== 'admin' && !ownsAnItem) {
      return res.status(403).json({ message: 'You can only update orders containing your own products.' });
    }

    // A Telebirr order must have its payment screenshot verified before the
    // farmer can move it past "Pending" — otherwise a farmer could dispatch
    // a product for an order that was never actually confirmed as paid.
    // Cash on Delivery / Chapa orders aren't affected: COD settles on
    // delivery, and Chapa is confirmed automatically via its webhook.
    if (
      status === 'Confirmed' &&
      order.paymentMethod === 'Telebirr' &&
      order.paymentStatus !== 'Paid' &&
      req.user.role !== 'admin'
    ) {
      return res.status(400).json({
        message: 'Please verify the Telebirr payment screenshot before confirming this order.',
      });
    }

    order.status = status;
    await order.save();

    notifyUser(order.buyer, `Your order status changed to "${status}"`);

    res.json({ message: 'Order status updated.', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders — admin: every order on the platform
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'fullName email phone')
      .populate('orderItems.product', 'name category farmer')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:id/verify-payment — farmer verifies payment proof (Telebirr screenshot)
const verifyPaymentProof = async (req, res) => {
  try {
    const { paymentId, verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ message: 'verified field must be true or false.' });
    }

    const order = await Order.findById(req.params.id).populate('orderItems.product', 'farmer');
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Only farmer with items in this order can verify payment
    const ownsAnItem = order.orderItems.some(
      (item) => item.product && item.product.farmer?.toString() === req.user._id.toString()
    );
    if (req.user.role !== 'admin' && !ownsAnItem) {
      return res.status(403).json({ message: 'You can only verify payment for orders containing your own products.' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.order.toString() !== order._id.toString()) {
      return res.status(400).json({ message: 'Payment does not belong to this order.' });
    }

    if (payment.paymentMethod !== 'Telebirr') {
      return res.status(400).json({ message: 'Only Telebirr payments require verification.' });
    }

    if (!payment.proofOfPayment?.url) {
      return res.status(400).json({ message: 'No payment proof uploaded for this order.' });
    }

    if (verified) {
      // Farmer verified the payment proof
      payment.status = 'Success';
      order.paymentStatus = 'Paid';
      notifyUser(order.buyer, `Payment verified for your order ${order._id.toString().slice(-6)}`);
    } else {
      // Farmer rejected the payment proof
      payment.status = 'Failed';
      notifyUser(order.buyer, `Payment proof rejected for order ${order._id.toString().slice(-6)}. Please upload a valid screenshot.`);
    }

    await payment.save();
    await order.save();

    res.json({
      message: verified ? 'Payment verified successfully.' : 'Payment proof rejected.',
      payment,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getMyOrders, getFarmerOrders, updateOrderStatus, getAllOrders, verifyPaymentProof };
