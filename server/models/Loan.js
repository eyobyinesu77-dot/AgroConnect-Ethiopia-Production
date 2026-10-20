const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [1000, 'Minimum loan amount is 1,000 ETB.'],
      max: [100000, 'Maximum loan amount is 100,000 ETB.'],
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    bankType: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: value => !value || /^\d+$/.test(value),
        message: "Bank account number must contain digits only.",
      },
    },

    duration: {
      type: String,
      required: true,
      enum: ['6 months', '1 year', '2 years', '3 years'],
    },

    cropImage: {
      type: String,
      default: '',
    },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },

    // Fixed interest rate for the entire loan duration
    interestRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // "total" means interest for the entire loan duration
    interestPeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'total'],
      default: 'total',
    },

    // Total interest amount in ETB
    interestAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Principal + total interest
    totalRepayment: {
      type: Number,
      min: 0,
      default: 0,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

loanSchema.index({ farmer: 1 });

module.exports = mongoose.model('Loan', loanSchema);
