import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Main API instance
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate API instance for file uploads.
// Do NOT set Content-Type here because Axios/browser
// must automatically create the multipart boundary.
const uploadAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Automatically attach JWT token
const attachToken = (config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

const onRequestError = (error) => {
  return Promise.reject(error);
};

// Request interceptors
API.interceptors.request.use(
  attachToken,
  onRequestError
);

uploadAPI.interceptors.request.use(
  attachToken,
  onRequestError
);

// Handle authentication errors
const handleAuthError = (error) => {
  if (
    error.response?.status === 401 &&
    window.location.pathname !== '/login'
  ) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.href = '/login';
  }

  return Promise.reject(error);
};

// Response interceptors
API.interceptors.response.use(
  (response) => response,
  handleAuthError
);

uploadAPI.interceptors.response.use(
  (response) => response,
  handleAuthError
);

// Exports
export { uploadAPI };

export default API;
