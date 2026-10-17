const Loan = require('../models/Loan');
const { notifyAdmins, notifyUser } = require('../utils/notify');
const { bankInstitutions, loanReasons } = require('../utils/loanConstants');
const { getUploadedFileUrl } = require('../utils/fileUrl');
const { calculateLoanInterest } = require('../utils/loanInterest');

const getLoanMetadata = async (req, res) => {
  res.json({ banks: bankInstitutions, reasons: loanReasons });
};

const applyLoan = async (req, res) => {
  try {
    const { amount, reason, bankType, duration } = req.body;
    const numericAmount = Number(amount);

    if (
      amount === undefined ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !reason ||
      !bankType ||
      !duration
    ) {
      return res.status(400).json({
        message: 'Valid amount, reason, bankType, and duration are required.',
      });
    }

    const loan = await Loan.create({
      farmer: req.user._id,
      amount: numericAmount,
      reason,
      bankType,
      duration,
      cropImage: getUploadedFileUrl(req),
    });

    notifyAdmins(
      `New loan request: ${numericAmount} ETB from ${req.user.fullName}`
    );

    return res.status(201).json({
      message: 'Your loan request has been submitted!',
      loan,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ farmer: req.user._id })
      .sort({ createdAt: -1 });

    return res.json(loans);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('farmer', 'fullName phone region zone woreda')
      .sort({ createdAt: -1 });

    return res.json(loans);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: 'status must be Approved or Rejected.',
      });
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found.' });
    }

    if (status === 'Approved') {
      let calculation;

      try {
        calculation = calculateLoanInterest(
          loan.amount,
          loan.duration
        );
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }

      loan.interestRate = calculation.interestRate;
      loan.interestPeriod = 'total';
      loan.interestAmount = calculation.interestAmount;
      loan.totalRepayment = calculation.totalRepayment;
      loan.approvedAt = new Date();
    }

    loan.status = status;
    await loan.save();

    notifyUser(
      loan.farmer,
      status === 'Approved'
        ? `Your loan was approved. Interest: ${loan.interestAmount} ETB. Total repayment: ${loan.totalRepayment} ETB.`
        : 'Your loan request was rejected.'
    );

    return res.json({
      message: `Loan ${status.toLowerCase()}.`,
      loan,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyLoan,
  getMyLoans,
  getAllLoans,
  updateLoanStatus,
  getLoanMetadata,
};
