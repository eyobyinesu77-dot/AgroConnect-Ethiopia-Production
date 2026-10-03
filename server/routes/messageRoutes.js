const express = require('express');
const router = express.Router();
const { getContacts, sendMessage, getConversation, getUnreadCounts } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/contacts', getContacts);
router.get('/unread-counts', getUnreadCounts);
router.post('/', sendMessage);
router.get('/:userId', getConversation);

module.exports = router;
