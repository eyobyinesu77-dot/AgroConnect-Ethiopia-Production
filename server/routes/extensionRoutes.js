const express = require('express');
const router = express.Router();
const { getFarmersList, createVisit, getMyVisits, getVisitsForFarmer } = require('../controllers/extensionController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Farmer-accessible route, registered before the extension-only gate below
// since it's the farmer's own side of the same Visit collection.
router.get('/visits/mine-as-farmer', protect, authorizeRoles('farmer'), getVisitsForFarmer);

router.use(protect, authorizeRoles('extension'));

router.get('/farmers', getFarmersList);
router.post('/visits', createVisit);
router.get('/visits', getMyVisits);

module.exports = router;
