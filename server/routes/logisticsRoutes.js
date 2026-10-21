const express = require('express');
const router = express.Router();
const c = require('../controllers/logisticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

// Aggregation (admin) — declared before '/:id' routes so paths don't collide.
router.get('/aggregation/suggestions', authorizeRoles('admin'), c.getAggregationSuggestions);
router.get('/aggregation/batches', authorizeRoles('admin'), c.getBatches);
router.post('/aggregation/batches', authorizeRoles('admin'), c.createBatch);
router.patch('/aggregation/batches/:id/assign', authorizeRoles('admin'), c.assignBatchProvider);
router.post('/aggregation/batches/:id/allocations', authorizeRoles('admin'), c.allocateBatch);

router.patch('/allocations/:allocationId/status', authorizeRoles('admin'), c.updateAllocationStatus);
router.post('/', authorizeRoles('farmer', 'buyer'), c.createRequest);
router.get('/mine', authorizeRoles('farmer', 'buyer'), c.getMyRequests);
router.get('/', authorizeRoles('admin'), c.getAllRequests);
router.get('/:id/matches', authorizeRoles('admin', 'farmer', 'buyer'), c.getRequestMatches);
router.patch('/:id/cancel', authorizeRoles('farmer', 'buyer'), c.cancelRequest);
router.patch('/:id/assign', authorizeRoles('admin'), c.assignProvider);
router.post('/:id/allocations', authorizeRoles('admin'), c.allocateRequest);
router.patch('/:id/status', authorizeRoles('admin'), c.updateRequestStatus);

module.exports = router;
