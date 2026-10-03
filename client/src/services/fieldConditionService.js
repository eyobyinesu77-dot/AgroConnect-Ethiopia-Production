import API from './api';

export const fieldConditionService = {
  createCondition: async ({ farmerId, conditionType, cropType, description, recommendation }) => {
    const response = await API.post('/field-conditions', { farmerId, conditionType, cropType, description, recommendation });
    return response.data;
  },
  updateCondition: async (id, { conditionType, cropType, description, recommendation }) => {
    const response = await API.patch(`/field-conditions/${id}`, { conditionType, cropType, description, recommendation });
    return response.data;
  },
  deleteCondition: async (id) => {
    const response = await API.delete(`/field-conditions/${id}`);
    return response.data;
  },
  getMyConditions: async () => {
    const response = await API.get('/field-conditions/mine');
    return response.data;
  },
  getConditionsForFarmer: async () => {
    const response = await API.get('/field-conditions');
    return response.data;
  },
};
