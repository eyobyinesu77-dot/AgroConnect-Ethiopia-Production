import API from './api';

export const weatherAdvisoryService = {
  // Extension worker: post a new advisory for farmers in their region/zone/woreda.
  createAdvisory: async ({ title, region, zone, woreda, condition, message, targetFarmers }) => {
    const response = await API.post('/weather-advisories', { title, region, zone, woreda, condition, message, targetFarmers });
    return response.data;
  },
  // Extension worker: their own posted advisories.
  getMyAdvisories: async () => {
    const response = await API.get('/weather-advisories/mine');
    return response.data;
  },
  // Extension worker: remove one of their own advisories.
  deleteAdvisory: async (id) => {
    const response = await API.delete(`/weather-advisories/${id}`);
    return response.data;
  },
  // Farmer: advisory feed for their own region/zone/woreda.
  getAdvisoriesForFarmer: async () => {
    const response = await API.get('/weather-advisories');
    return response.data;
  },
};
