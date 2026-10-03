const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getFarmerOrders, updateOrderStatus, getAllOrders, verifyPaymentProof } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('buyer'), createOrder);
router.get('/mine', protect, authorizeRoles('buyer'), getMyOrders);
router.get('/farmer-orders', protect, authorizeRoles('farmer'), getFarmerOrders);
router.get('/', protect, authorizeRoles('admin'), getAllOrders);
router.patch('/:id/status', protect, authorizeRoles('farmer', 'admin'), updateOrderStatus);
// Farmer verifies Telebirr payment proof
router.patch('/:id/verify-payment', protect, authorizeRoles('farmer', 'admin'), verifyPaymentProof);

module.exports = router;
