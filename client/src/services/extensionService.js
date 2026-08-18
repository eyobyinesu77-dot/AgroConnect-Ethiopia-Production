import API from './api';

export const extensionService = {
  getFarmersList: async () => {
    const response = await API.get('/extension/farmers');
    return response.data;
  },
  createVisit: async (visitData) => {
    const response = await API.post('/extension/visits', visitData);
    return response.data;
  },
  getMyVisits: async () => {
    const response = await API.get('/extension/visits');
    return response.data;
  },
  getVisitsForFarmer: async () => {
    const response = await API.get('/extension/visits/mine-as-farmer');
    return response.data;
  }
};
