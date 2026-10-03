const express = require('express');
const router = express.Router();
const { createTraining, getMyTrainings, getTrainingsForFarmer, deleteTraining } = require('../controllers/trainingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('extension'), createTraining);
router.get('/mine', protect, authorizeRoles('extension'), getMyTrainings);
router.delete('/:id', protect, authorizeRoles('extension'), deleteTraining);
router.get('/', protect, authorizeRoles('farmer'), getTrainingsForFarmer);

module.exports = router;
