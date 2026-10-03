import API from './api';

export const adviceService = {
  createAdvice: async ({ title, content, cropType, zone, targetFarmers }) => {
    const response = await API.post('/advice', { title, content, cropType, zone, targetFarmers });
    return response.data;
  },
  getMyAdvice: async () => {
    const response = await API.get('/advice/mine');
    return response.data;
  },
  deleteAdvice: async (id) => {
    const response = await API.delete(`/advice/${id}`);
    return response.data;
  },
  getAdviceForFarmer: async () => {
    const response = await API.get('/advice');
    return response.data;
  },
};
