const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUsers, updateUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.put('/:id', protect, authorizeRoles('admin'), updateUser);

module.exports = router;
