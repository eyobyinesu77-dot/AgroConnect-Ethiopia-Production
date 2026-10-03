const express = require('express');
const router = express.Router();
const { applyLoan, getMyLoans, getAllLoans, updateLoanStatus, getLoanMetadata } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { cropImageUploadMiddleware } = require('../middleware/uploadMiddleware');

// Dropdown options (banks + reasons) for the loan application form.
// Registered before '/:id/status' style routes don't apply here since this
// is a distinct literal path, but keep it above '/' for clarity.
router.get('/metadata', protect, authorizeRoles('farmer'), getLoanMetadata);

router.post('/', protect, authorizeRoles('farmer'), cropImageUploadMiddleware, applyLoan);
router.get('/mine', protect, authorizeRoles('farmer'), getMyLoans);
router.get('/', protect, authorizeRoles('admin'), getAllLoans);
router.patch('/:id/status', protect, authorizeRoles('admin'), updateLoanStatus);

module.exports = router;
