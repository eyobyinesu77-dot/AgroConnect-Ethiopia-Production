import API from './api';

export const userService = {
  getProfile: async () => {
    const response = await API.get('/users/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await API.put('/users/profile', data);
    return response.data;
  },
  getAllUsers: async () => {
    const response = await API.get('/users');
    return response.data;
  }
};