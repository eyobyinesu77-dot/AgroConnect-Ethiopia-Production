import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate instance for file uploads (FormData bodies).
// Deliberately has NO default Content-Type. If this shared instance's
// 'application/json' default were reused as-is, axios's own transformRequest
// logic checks the current Content-Type header and — when it sees
// 'application/json' — JSON.stringifies the FormData instead of sending it
// as a real multipart request, so the upload would silently break before it
// even reaches the network. Leaving Content-Type unset here lets axios (and
// ultimately the browser) detect the FormData body and set the correct
// 'multipart/form-data; boundary=...' header itself, which is the only way
// the boundary parameter needed for the server's multer parser gets set.
const uploadAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Interceptor that automatically attaches the token from Storage
const attachToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const onRequestError = (error) => Promise.reject(error);

API.interceptors.request.use(attachToken, onRequestError);
uploadAPI.interceptors.request.use(attachToken, onRequestError);

// If the token is missing/expired/invalid, the server responds 401 on any
// protected route. Without this, every page would just show a scattered
// "Not authorized" toast forever with no way back to a working state —
// this clears the stale session and sends the user to log in again.
const handleAuthError = (error) => {
  if (error.response?.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

API.interceptors.response.use((response) => response, handleAuthError);
uploadAPI.interceptors.response.use((response) => response, handleAuthError);

export { uploadAPI };
export default API;
