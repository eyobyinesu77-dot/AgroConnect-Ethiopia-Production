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
  logout: async () => {
    localStorage.removeItem('token');
  }
};