import API from './api';

export const logisticsService = {
  // Provider directory
  getProviders: async (params = {}) => (await API.get('/transport-providers', { params })).data,
  createProvider: async (data) => (await API.post('/transport-providers', data)).data,
  updateProvider: async (id, data) => (await API.put(`/transport-providers/${id}`, data)).data,
  deleteProvider: async (id) => (await API.delete(`/transport-providers/${id}`)).data,

  // Requests (farmer / buyer)
  createRequest: async (data) => (await API.post('/logistics', data)).data,
  getMyRequests: async () => (await API.get('/logistics/mine')).data,
  cancelRequest: async (id) => (await API.patch(`/logistics/${id}/cancel`)).data,

  // Requests (admin)
  getAllRequests: async (params = {}) => (await API.get('/logistics', { params })).data,
  getMatches: async (id) => (await API.get(`/logistics/${id}/matches`)).data,
  assignProvider: async (id, providerId) => (await API.patch(`/logistics/${id}/assign`, { providerId })).data,
  updateStatus: async (id, status) => (await API.patch(`/logistics/${id}/status`, { status })).data,

  // Aggregation (admin)
  getSuggestions: async () => (await API.get('/logistics/aggregation/suggestions')).data,
  getBatches: async () => (await API.get('/logistics/aggregation/batches')).data,
  createBatch: async (requestIds, providerId) =>
    (await API.post('/logistics/aggregation/batches', { requestIds, providerId })).data,
  assignBatchProvider: async (id, providerId) =>
    (await API.patch(`/logistics/aggregation/batches/${id}/assign`, { providerId })).data,
};
