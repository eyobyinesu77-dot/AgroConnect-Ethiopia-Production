const express = require('express');
const router = express.Router();
const { createAdvice, getMyAdvice, getAdviceForFarmer, deleteAdvice } = require('../controllers/adviceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('extension'), createAdvice);
router.get('/mine', protect, authorizeRoles('extension'), getMyAdvice);
router.delete('/:id', protect, authorizeRoles('extension'), deleteAdvice);
router.get('/', protect, authorizeRoles('farmer'), getAdviceForFarmer);

module.exports = router;
