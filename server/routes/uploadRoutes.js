const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/uploadController');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, uploadMiddleware, uploadFile);

module.exports = router;
