import API from './api';

export const messageService = {
  getContacts: async () => {
    const response = await API.get('/messages/contacts');
    return response.data;
  },
  getUnreadCounts: async () => {
    const response = await API.get('/messages/unread-counts');
    return response.data; // { [senderId]: count }
  },
  getConversation: async (userId) => {
    const response = await API.get(`/messages/${userId}`);
    return response.data;
  },
  sendMessage: async (recipientId, content) => {
    const response = await API.post('/messages', { recipientId, content });
    return response.data;
  }
};
