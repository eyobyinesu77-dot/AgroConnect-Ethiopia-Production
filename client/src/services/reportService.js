import API from './api';

export const reportService = {
  generateAdminReport: async () => {
    const response = await API.get('/reports');
    return response.data;
  },
  getMyReports: async () => {
    const response = await API.get('/reports/mine');
    return response.data;
  },
  generateExtensionReport: async () => {
    const response = await API.get('/reports/extension');
    return response.data;
  }
};
