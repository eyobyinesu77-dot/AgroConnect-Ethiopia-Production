import API from './api';

export const trainingService = {
  createTraining: async ({ title, description, date, location, zone, targetFarmers }) => {
    const response = await API.post('/trainings', { title, description, date, location, zone, targetFarmers });
    return response.data;
  },
  getMyTrainings: async () => {
    const response = await API.get('/trainings/mine');
    return response.data;
  },
  deleteTraining: async (id) => {
    const response = await API.delete(`/trainings/${id}`);
    return response.data;
  },
  getTrainingsForFarmer: async () => {
    const response = await API.get('/trainings');
    return response.data;
  },
};
