import API from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await API.post('/orders', orderData);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await API.get('/orders/mine');
    return response.data;
  },
  getFarmerOrders: async () => {
    const response = await API.get('/orders/farmer-orders');
    return response.data;
  },
  getAllOrders: async () => {
    const response = await API.get('/orders');
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await API.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
  // Farmer verifies (or rejects) a buyer's Telebirr payment screenshot for an order.
  verifyPayment: async (orderId, paymentId, verified) => {
    const response = await API.patch(`/orders/${orderId}/verify-payment`, { paymentId, verified });
    return response.data;
  }
};
