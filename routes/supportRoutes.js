const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getAllTickets, updateTicketStatus, deleteTicket, replyToTicket } = require('../controllers/supportController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', optionalAuth, createTicket);
router.get('/mine', protect, getMyTickets);
router.get('/', protect, authorizeRoles('admin'), getAllTickets);
router.patch('/:id/status', protect, authorizeRoles('admin'), updateTicketStatus);
router.delete('/:id', protect, authorizeRoles('admin'), deleteTicket);
// Admin replies to public message
router.post('/:id/reply', protect, authorizeRoles('admin'), replyToTicket);

module.exports = router;
