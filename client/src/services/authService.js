import API from './api';

export const authService = {
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
  },
  changePassword: async (newPassword) => {
    const response = await API.put('/auth/change-password', { newPassword });
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token, password) => {
    const response = await API.post('/auth/reset-password', { token, password });
    return response.data;
  },
  verifyEmail: async (token) => {
    const response = await API.get(`/auth/verify-email/${token}`);
    return response.data;
  },
  resendVerification: async (email) => {
    const response = await API.post('/auth/resend-verification', { email });
    return response.data;
  },
  logout: async () => {
    localStorage.removeItem('token');
  }
};