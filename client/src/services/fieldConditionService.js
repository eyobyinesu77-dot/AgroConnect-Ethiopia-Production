import API, { uploadAPI } from './api';

const toFormData = (data) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  return form;
};

export const fieldConditionService = {
  createCondition: async ({ farmerId, conditionType, cropType, description, recommendation, image }) => {
    const response = await uploadAPI.post(
      '/field-conditions',
      toFormData({ farmerId, conditionType, cropType, description, recommendation, image })
    );
    return response.data;
  },
  updateCondition: async (id, { conditionType, cropType, description, recommendation, image }) => {
    const response = await uploadAPI.patch(
      `/field-conditions/${id}`,
      toFormData({ conditionType, cropType, description, recommendation, image })
    );
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
