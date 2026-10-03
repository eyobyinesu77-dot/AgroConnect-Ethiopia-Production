import API from './api';

export const categoryService = {
  getCategories: async () => {
    const response = await API.get('/categories');
    return response.data;
  },
  createCategory: async (categoryData) => {
    const response = await API.post('/categories', categoryData);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await API.delete(`/categories/${id}`);
    return response.data;
  }
};
