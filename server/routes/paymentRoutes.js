const express = require('express');
const router = express.Router();
const { processPayment, getMyPayments, getAllPayments, chapaWebhook, uploadTelebirrProof } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.post('/pay', protect, authorizeRoles('buyer'), processPayment);
router.get('/mine', protect, authorizeRoles('buyer'), getMyPayments);
router.get('/', protect, authorizeRoles('admin'), getAllPayments);
router.post('/chapa-webhook', chapaWebhook);
// Telebirr screenshot proof upload (buyer only)
router.post('/:paymentId/telebirr-proof', protect, authorizeRoles('buyer'), uploadMiddleware, uploadTelebirrProof);

module.exports = router;
