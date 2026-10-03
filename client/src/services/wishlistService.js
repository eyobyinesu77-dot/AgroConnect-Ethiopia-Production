import API from './api';

export const wishlistService = {
  getWishlist: async () => {
    const response = await API.get('/wishlist');
    return response.data;
  },
  addToWishlist: async (productId) => {
    const response = await API.post(`/wishlist/${productId}`);
    return response.data;
  },
  removeFromWishlist: async (productId) => {
    const response = await API.delete(`/wishlist/${productId}`);
    return response.data;
  }
};
