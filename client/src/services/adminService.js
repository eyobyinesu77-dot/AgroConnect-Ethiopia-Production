import API from './api';

export const adminService = {
  getStats: async () => {
    const response = await API.get('/admin/stats');
    return response.data;
  },
  getFarmers: async () => {
    const response = await API.get('/admin/farmers');
    return response.data;
  },
  getBuyers: async () => {
    const response = await API.get('/admin/buyers');
    return response.data;
  },
  getExtensionWorkers: async () => {
    const response = await API.get('/admin/extension-workers');
    return response.data;
  },
  createExtensionWorker: async (workerData) => {
    const response = await API.post('/admin/extension-workers', workerData);
    return response.data;
  },
  assignExtensionWorker: async (farmerId, extensionWorkerId) => {
    const response = await API.patch(`/admin/farmers/${farmerId}/assign-extension-worker`, { extensionWorkerId });
    return response.data;
  }
};
