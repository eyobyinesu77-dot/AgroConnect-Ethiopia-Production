const express = require('express');
const router = express.Router();
const {
  createFieldCondition,
  updateFieldCondition,
  deleteFieldCondition,
  getMyFieldConditions,
  getFieldConditionsForFarmer,
} = require('../controllers/fieldConditionController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.post('/', protect, authorizeRoles('extension'), uploadMiddleware, createFieldCondition);
router.get('/mine', protect, authorizeRoles('extension'), getMyFieldConditions);
router.patch('/:id', protect, authorizeRoles('extension'), uploadMiddleware, updateFieldCondition);
router.delete('/:id', protect, authorizeRoles('extension'), deleteFieldCondition);
router.get('/', protect, authorizeRoles('farmer'), getFieldConditionsForFarmer);

module.exports = router;
