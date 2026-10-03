import API from './api';

export const weatherService = {
  // Fetches live weather from the backend's real API integration
  // (server/controllers/weatherController.js). `region` is sent as a query
  // parameter so the request carries the farmer's location explicitly; the
  // Authorization header is attached automatically by API's request
  // interceptor (see api.js), so auth travels securely on every call too.
  getWeather: async (region) => {
    const response = await API.get('/weather/live', { params: region ? { region } : {} });
    return response.data;
  }
};
