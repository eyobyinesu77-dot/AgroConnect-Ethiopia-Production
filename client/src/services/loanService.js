import API from './api';

export const loanService = {
  getLoanMetadata: async () => {
    const response = await API.get('/loans/metadata');
    return response.data;
  },

  applyLoan: async ({ amount, reason, bankType, duration }) => {
    const response = await API.post('/loans', {
      amount,
      reason,
      bankType,
      duration,
    });
    return response.data;
  },

  getMyLoans: async () => {
    const response = await API.get('/loans/mine');
    return response.data;
  },

  getAllLoans: async () => {
    const response = await API.get('/loans');
    return response.data;
  },

  updateLoanStatus: async (id, status, terms = {}) => {
    const response = await API.patch(`/loans/${id}/status`, {
      status,
      ...terms,
    });
    return response.data;
  },
};
