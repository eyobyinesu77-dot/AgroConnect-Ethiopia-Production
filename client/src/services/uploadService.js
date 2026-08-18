import { uploadAPI } from './api';

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    // Uses the dedicated uploadAPI instance (see api.js) — it has no
    // default 'Content-Type: application/json' header, so axios lets the
    // browser compute the correct multipart boundary for this FormData body.
    const response = await uploadAPI.post('/upload', formData);
    return response.data; // { message, url }
  }
};
