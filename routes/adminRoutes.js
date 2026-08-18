const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getFarmers,
  getBuyers,
  getExtensionWorkers,
  createExtensionWorker,
  assignExtensionWorker,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect, authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/farmers', getFarmers);
router.get('/buyers', getBuyers);
router.get('/extension-workers', getExtensionWorkers);
router.post('/extension-workers', createExtensionWorker);
router.patch('/farmers/:farmerId/assign-extension-worker', assignExtensionWorker);

module.exports = router;
