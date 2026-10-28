const express = require('express');
const router = express.Router();
const c = require('../controllers/logisticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

// Directory is browsable by any signed-in role; only admins manage it.
router.get('/', c.listProviders);
router.post('/', authorizeRoles('admin'), c.createProvider);
router.put('/:id', authorizeRoles('admin'), c.updateProvider);
router.delete('/:id', authorizeRoles('admin'), c.deleteProvider);

module.exports = router;
