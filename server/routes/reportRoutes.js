const express = require('express');
const router = express.Router();
const { generateAdminReport, getMyReports, generateExtensionReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, authorizeRoles('admin'), generateAdminReport);
router.get('/mine', protect, authorizeRoles('admin'), getMyReports);
router.get('/extension', protect, authorizeRoles('extension'), generateExtensionReport);

module.exports = router;
