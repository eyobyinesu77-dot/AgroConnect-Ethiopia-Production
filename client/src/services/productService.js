import API from './api';

export const productService = {
  getAllProducts: async (params) => {
    const response = await API.get('/products', { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },
  getMyProducts: async () => {
    const response = await API.get('/products/mine');
    return response.data;
  },
  createProduct: async (productData) => {
    const response = await API.post('/products', productData);
    return response.data;
  },
  updateProduct: async (id, updates) => {
    const response = await API.patch(`/products/${id}`, updates);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await API.delete(`/products/${id}`);
    return response.data;
  }
};