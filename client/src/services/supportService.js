import API from './api';

export const supportService = {
  createTicket: async (ticketData) => {
    const response = await API.post('/support', ticketData);
    return response.data;
  },
  getMyTickets: async () => {
    const response = await API.get('/support/mine');
    return response.data;
  },
  getAllTickets: async () => {
    const response = await API.get('/support');
    return response.data;
  },
  updateTicketStatus: async (id, status) => {
    const response = await API.patch(`/support/${id}/status`, { status });
    return response.data;
  },
  deleteTicket: async (id) => {
    const response = await API.delete(`/support/${id}`);
    return response.data;
  }
};
