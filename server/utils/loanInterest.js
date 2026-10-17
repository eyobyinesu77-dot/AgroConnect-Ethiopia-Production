const LOAN_INTEREST_RATES = Object.freeze({
  '6 months': 12,
  '1 year': 15,
  '2 years': 18,
  '3 years': 20,
});

function calculateLoanInterest(amount, duration) {
  const principal = Number(amount);
  const normalizedDuration = String(duration || '')
    .trim()
    .toLowerCase();

  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error('Loan amount must be greater than zero.');
  }

  const interestRate = LOAN_INTEREST_RATES[normalizedDuration];

  if (interestRate === undefined) {
    throw new Error('Please select a valid loan duration.');
  }

  const interestAmount = Math.round(
    (principal * interestRate / 100 + Number.EPSILON) * 100
  ) / 100;

  const totalRepayment = Math.round(
    (principal + interestAmount + Number.EPSILON) * 100
  ) / 100;

  return {
    interestRate,
    interestAmount,
    totalRepayment,
  };
}

module.exports = {
  calculateLoanInterest,
  LOAN_INTEREST_RATES,
};
