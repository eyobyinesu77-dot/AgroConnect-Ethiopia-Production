import API, { uploadAPI } from './api';

export const paymentService = {
  initializePayment: async (paymentData) => {
    const response = await API.post('/payments/pay', paymentData);
    return response.data;
  },
  getMyPayments: async () => {
    const response = await API.get('/payments/mine');
    return response.data;
  },
  getAllPayments: async () => {
    const response = await API.get('/payments');
    return response.data;
  },
  // Buyer uploads a Telebirr screenshot plus the transaction ID printed on
  // their receipt/SMS — the transaction ID is what the backend checks for
  // reuse across all payments on the platform.
  uploadTelebirrProof: async (paymentId, { file, transactionId }) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('transactionId', transactionId);

    const response = await uploadAPI.post(`/payments/${paymentId}/telebirr-proof`, formData);
    return response.data;
  }
};
