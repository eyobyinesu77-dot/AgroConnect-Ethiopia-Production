import API from './api';

export const notificationService = {
  getMyNotifications: async () => {
    const response = await API.get('/notifications/mine');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await API.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await API.patch('/notifications/read-all');
    return response.data;
  }
};
