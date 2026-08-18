const express = require('express');
const router = express.Router();
const {
  createAdvisory,
  getMyAdvisories,
  getAdvisoriesForFarmer,
  deleteAdvisory,
} = require('../controllers/weatherAdvisoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('extension'), createAdvisory);
router.get('/mine', protect, authorizeRoles('extension'), getMyAdvisories);
router.delete('/:id', protect, authorizeRoles('extension'), deleteAdvisory);
router.get('/', protect, authorizeRoles('farmer'), getAdvisoriesForFarmer);

module.exports = router;
