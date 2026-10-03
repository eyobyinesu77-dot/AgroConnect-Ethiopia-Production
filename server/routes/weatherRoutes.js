const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weatherController');
const { protect } = require('../middleware/authMiddleware');

// Primary endpoint the frontend calls for live weather data.
router.get('/live', protect, getWeather);
// Kept for backward compatibility with any existing callers.
router.get('/', protect, getWeather);

module.exports = router;
