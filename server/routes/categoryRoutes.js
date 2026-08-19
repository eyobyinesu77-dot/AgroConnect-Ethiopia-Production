const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', getCategories);
router.post('/', protect, authorizeRoles('admin'), createCategory);
router.delete('/:id', protect, authorizeRoles('admin'), deleteCategory);

module.exports = router;
