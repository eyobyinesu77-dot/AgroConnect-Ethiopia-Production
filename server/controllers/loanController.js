const Loan = require('../models/Loan');
const { notifyAdmins, notifyUser } = require('../utils/notify');
const { bankInstitutions, loanReasons } = require('../utils/loanConstants');
const { getUploadedFileUrl } = require('../utils/fileUrl');

// GET /api/loans/metadata — dropdown options for the loan application form
// (bank institutions + common loan reasons). Static list, no DB round-trip.
const getLoanMetadata = async (req, res) => {
  res.json({ banks: bankInstitutions, reasons: loanReasons });
};

// POST /api/loans — farmer applies for a loan.
// Submitted as multipart/form-data (see uploadMiddleware's `cropImage`
// field) so the optional crop-type photo can travel in the same request;
// req.file is populated by multer + Cloudinary storage when a file is sent.
const applyLoan = async (req, res) => {
  try {
    const { amount, reason, bankType, duration } = req.body;
    if (!amount || !reason || !bankType || !duration) {
      return res.status(400).json({ message: 'amount, reason, bankType, and duration are required.' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'amount must be greater than 0.' });
    }

    const loan = await Loan.create({
      farmer: req.user._id,
      amount,
      reason,
      bankType,
      duration,
      cropImage: getUploadedFileUrl(req),
    });

    notifyAdmins(`New loan request: ${amount} ETB from ${req.user.fullName}`);

    res.status(201).json({ message: 'Your loan request has been submitted!', loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/loans/mine — farmer's own loan applications
const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/loans — admin: every loan application
const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('farmer', 'fullName phone region zone woreda')
      .sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/loans/:id/status — admin approves or rejects
const updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be Approved or Rejected.' });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found.' });
    }

    loan.status = status;
    await loan.save();

    notifyUser(loan.farmer, `Your loan request was ${status.toLowerCase()}.`);

    res.json({ message: `Loan ${status.toLowerCase()}.`, loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLoan, getMyLoans, getAllLoans, updateLoanStatus, getLoanMetadata };
