const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getMyProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', getProducts);
router.get('/mine', protect, authorizeRoles('farmer'), getMyProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorizeRoles('farmer'), createProduct);
router.patch('/:id', protect, authorizeRoles('farmer', 'admin'), updateProduct);
router.delete('/:id', protect, authorizeRoles('farmer', 'admin'), deleteProduct);

module.exports = router;
