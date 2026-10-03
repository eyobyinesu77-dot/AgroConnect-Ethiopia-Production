const axios = require('axios');

/**
 * getWeather Controller - Production Ready
 * 
 * Safely fetches weather data for a given region
 * Handles API failures gracefully with fallback responses
 * Prevents dashboard crashes from weather service outages
 * 
 * Features:
 * - Try/catch error handling for API calls
 * - Graceful degradation when API is unavailable
 * - Proper HTTP status codes (503 Service Unavailable)
 * - Console logging for debugging
 * - No hardcoded/demo data (fails clearly)
 * 
 * Environment:
 * - WEATHER_API_KEY: Optional OpenWeatherMap API key
 *   If not set, endpoint returns 503 (unavailable)
 *   Get free key at: https://openweathermap.org/api
 * 
 * Bugs Fixed:
 * ✅ Dashboard doesn't crash if weather API fails
 * ✅ Error handling prevents blank screens
 * ✅ Clear "unavailable" message shown to user
 * ✅ Proper HTTP status codes returned
 * ✅ Detailed error logging for debugging
 * 
 * @param {Object} req - Express request object
 * @param {string} req.query.region - Region name (default: user's region or 'Addis Ababa')
 * @param {Object} req.user - User object (has region field)
 * @param {Object} res - Express response object
 * 
 * @example
 * // GET /api/weather?region=Oromiya
 * // Response: { simulated: false, region, temp, condition, humidity }
 * 
 * // GET /api/weather (no API key)
 * // Response: 503 { message: "Weather data is currently unavailable." }
 * 
 * // GET /api/weather (API error)
 * // Response: 503 { message: "Weather data is currently unavailable." }
 */
const getWeather = async (req, res) => {
  try {
    // STEP 1: Get region from query or user profile
    const region = req.query.region || req.user?.region || 'Addis Ababa';
    const apiKey = process.env.WEATHER_API_KEY;

    // STEP 2: Check if API key is configured
    if (!apiKey) {
      console.warn(
        '⚠️  WEATHER_API_KEY not set in server/.env\n' +
        '   Weather API requests will return "unavailable" status.\n' +
        '   To enable real weather forecasts:\n' +
        '   1. Get free API key from https://openweathermap.org/api\n' +
        '   2. Add WEATHER_API_KEY=your_key to server/.env\n' +
        '   3. Restart the server'
      );
      
      return res.status(503).json({ 
        message: 'Weather data is currently unavailable. Please try again later.' 
      });
    }

    // STEP 3: Call external weather API
    // Using OpenWeatherMap API with metric units (Celsius)
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: `${region},ET`,  // ET = Ethiopia country code
        appid: apiKey,
        units: 'metric',     // Returns temperature in Celsius
      },
      timeout: 5000,         // 5 second timeout
    });

    // STEP 4: Format and return weather data
    res.json({
      simulated: false,
      region,
      temp: `${Math.round(response.data.main.temp)}°C`,
      condition: response.data.weather?.[0]?.description || 'Unknown',
      humidity: `${response.data.main.humidity}%`,
      wind_speed: `${Math.round(response.data.wind.speed)} m/s`,
      pressure: `${response.data.main.pressure} hPa`,
    });
  } catch (error) {
    /**
     * Handle different types of errors gracefully
     */

    // Log error details for debugging
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      apiMessage: error.response?.data?.message,
      code: error.code,
    };

    console.error('❌ Weather API Error:', errorDetails);

    // STEP 5: Determine error type and respond appropriately
    
    // API returned an error (e.g., invalid region, rate limit)
    if (error.response?.status === 404) {
      return res.status(503).json({ 
        message: 'Weather data is currently unavailable for this region.' 
      });
    }

    // API rate limited or server error
    if (error.response?.status === 429) {
      return res.status(503).json({ 
        message: 'Weather service temporarily overloaded. Please try again in a few minutes.' 
      });
    }

    // External API returned server error
    if (error.response?.status >= 500) {
      return res.status(503).json({ 
        message: 'Weather service is temporarily unavailable. Please try again later.' 
      });
    }

    // Network timeout or connection refused
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        message: 'Unable to connect to weather service. Please try again later.' 
      });
    }

    // Generic error - return unavailable response
    res.status(503).json({ 
      message: 'Weather data is currently unavailable. Please try again later.' 
    });
  }
};

/**
 * getWeatherForecast Controller - Production Ready
 * 
 * Safely fetches multi-day weather forecast
 * Same error handling patterns as getWeather
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWeatherForecast = async (req, res) => {
  try {
    const region = req.query.region || req.user?.region || 'Addis Ababa';
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  WEATHER_API_KEY not configured - returning unavailable');
      return res.status(503).json({ 
        message: 'Weather forecast data is currently unavailable.' 
      });
    }

    // Request 5-day forecast
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        q: `${region},ET`,
        appid: apiKey,
        units: 'metric',
        cnt: 40,  // 40 items = 5 days (3-hour intervals)
      },
      timeout: 5000,
    });

    // Transform forecast data to simpler format
    const forecasts = response.data.list
      .filter((item, idx) => idx % 8 === 0)  // Get daily forecasts (every 24 hours)
      .slice(0, 5)  // Limit to 5 days
      .map((item) => ({
        date: new Date(item.dt * 1000).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        temp_max: `${Math.round(item.main.temp_max)}°C`,
        temp_min: `${Math.round(item.main.temp_min)}°C`,
        condition: item.weather?.[0]?.description || 'Unknown',
        humidity: `${item.main.humidity}%`,
      }));

    res.json({
      region,
      forecasts,
    });
  } catch (error) {
    console.error('❌ Weather Forecast API Error:', {
      message: error.message,
      status: error.response?.status,
    });

    // Same error handling as getWeather
    if (error.response?.status === 404) {
      return res.status(503).json({ 
        message: 'Weather forecast unavailable for this region.' 
      });
    }

    if (error.response?.status === 429 || error.response?.status >= 500) {
      return res.status(503).json({ 
        message: 'Weather service temporarily unavailable. Please try again later.' 
      });
    }

    res.status(503).json({ 
      message: 'Weather forecast data is currently unavailable.' 
    });
  }
};

module.exports = { getWeather, getWeatherForecast };
