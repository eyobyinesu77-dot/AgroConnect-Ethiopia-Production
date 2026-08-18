import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { weatherService } from '../../services/weatherService';
import { weatherAdvisoryService } from '../../services/weatherAdvisoryService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Weather Component
 * 
 * Displays region-based weather information tailored for farmers.
 * Shows temperature, conditions, humidity, wind speed, and agricultural advisory.
 * Modern Tailwind CSS design with responsive layout.
 */
export default function Weather() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extension-worker-posted advisories — a separate feed from the live
  // forecast above, per the on-the-ground guidance extension workers add.
  const [advisories, setAdvisories] = useState([]);
  const [isAdvisoriesLoading, setIsAdvisoriesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Pass the farmer's own region as the location parameter so the
        // forecast matches where they actually farm, instead of relying
        // solely on the backend's generic fallback.
        const data = await weatherService.getWeather(user?.region);
        
        if (isMounted) {
          setWeather(data);
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err.response?.data?.message || 'Failed to load weather data.';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const loadAdvisories = async () => {
      try {
        const data = await weatherAdvisoryService.getAdvisoriesForFarmer();
        if (isMounted) setAdvisories(data);
      } catch (err) {
        // Advisories are a supplementary feed — a failure here shouldn't
        // block or overwrite the primary weather error/loading state.
      } finally {
        if (isMounted) setIsAdvisoriesLoading(false);
      }
    };

    loadWeather();
    loadAdvisories();

    return () => {
      isMounted = false;
    };
  }, [user?.region]);

  /**
   * Get weather icon based on condition
   */
  const getWeatherIcon = (condition) => {
    if (!condition) return <Cloud className="w-12 h-12 text-gray-400" />;
    
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('precipitation')) {
      return <CloudRain className="w-12 h-12 text-blue-500" />;
    }
    if (lowerCondition.includes('clear') || lowerCondition.includes('sunny') || lowerCondition.includes('sun')) {
      return <Sun className="w-12 h-12 text-yellow-500" />;
    }
    if (lowerCondition.includes('cloud')) {
      return <Cloud className="w-12 h-12 text-gray-500" />;
    }
    return <Cloud className="w-12 h-12 text-gray-400" />;
  };

  /**
   * Get agricultural advisory based on conditions
   */
  const getAgricultureAdvisory = (condition, temp) => {
    if (!condition) return t('weather_advisory_default');
    
    const lowerCondition = condition.toLowerCase();
    const tempNum = typeof temp === 'string' ? parseInt(temp) : temp;

    if (lowerCondition.includes('rain')) {
      return t('weather_advisory_rain');
    }
    if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
      return t('weather_advisory_sunny');
    }
    if (tempNum > 35) {
      return t('weather_advisory_hot');
    }
    if (tempNum < 10) {
      return t('weather_advisory_cold');
    }
    return t('weather_advisory_stable');
  };

  // Extension Worker Advisories — a separate feed from the live forecast,
  // rendered in both the success and error paths below (a live-forecast
  // failure shouldn't hide advisories farmers still need to see).
  const advisoriesSection = (
    <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 px-4 sm:px-6 py-4">
        <h3 className="text-lg font-bold text-amber-900">{t('weather_advisories_title')}</h3>
      </div>
      <div className="p-4 sm:p-6">
        {isAdvisoriesLoading ? (
          <p className="text-sm text-gray-500">{t('weather_advisories_loading')}</p>
        ) : advisories.length === 0 ? (
          <p className="text-sm text-gray-500">{t('weather_advisories_empty')}</p>
        ) : (
          <div className="space-y-3">
            {advisories.map((advisory) => (
              <div key={advisory._id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-bold text-amber-900">{advisory.title}</p>
                <p className="text-sm font-semibold text-amber-800 mt-0.5">{advisory.condition}</p>
                <p className="text-sm text-amber-800 mt-1">{advisory.message}</p>
                <p className="text-xs text-amber-700 mt-2">
                  {advisory.extensionWorker?.fullName ? `${t('weather_advisory_from')} ${advisory.extensionWorker.fullName} · ` : ''}
                  {new Date(advisory.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <Cloud className="w-8 h-8 text-green-600" />
            </div>
            <span className="ml-3 text-gray-600 font-medium">{t('weather_loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold">{t('weather_unavailable_title')}</p>
              <p className="text-red-800 text-sm mt-1">{error || t('weather_unavailable_fallback')}</p>
            </div>
          </div>
        </div>
        {advisoriesSection}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
      {/* Simulated Data Notice */}
      {weather.simulated && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            <span className="font-semibold">{t('weather_demo_mode_label')}</span> {t('weather_demo_mode_text')}
          </p>
        </div>
      )}

      {/* Main Weather Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header with location */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-4 sm:px-6 py-4 sm:py-5">
          <h2 className="text-xl sm:text-2xl font-bold text-green-900 mb-1">
            {t('weather_title')}
          </h2>
          <p className="text-sm text-green-700">
            {weather.region || t('weather_your_region')}
          </p>
        </div>

        {/* Weather Display */}
        <div className="p-4 sm:p-6 lg:p-8">
          
          {/* Temperature and Condition - Main Section */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex-shrink-0">
                {getWeatherIcon(weather.condition)}
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-gray-900">
                  {weather.temp}
                  <span className="text-2xl sm:text-3xl ml-1">°C</span>
                </p>
                <p className="text-lg sm:text-xl text-gray-600 capitalize mt-1">
                  {weather.condition}
                </p>
              </div>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            
            {/* Humidity */}
            {weather.humidity && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900">{t('weather_humidity')}</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">{weather.humidity}</p>
              </div>
            )}

            {/* Wind Speed */}
            {weather.windSpeed && (
              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-5 h-5 text-cyan-600" />
                  <p className="text-sm font-semibold text-cyan-900">{t('weather_wind_speed')}</p>
                </div>
                <p className="text-2xl font-bold text-cyan-700">{weather.windSpeed}</p>
              </div>
            )}

            {/* Feels Like */}
            {weather.feelsLike && (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-5 h-5 text-orange-600" />
                  <p className="text-sm font-semibold text-orange-900">{t('weather_feels_like')}</p>
                </div>
                <p className="text-2xl font-bold text-orange-700">{weather.feelsLike}°C</p>
              </div>
            )}

            {/* Visibility */}
            {weather.visibility && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-semibold text-purple-900">{t('weather_visibility')}</p>
                </div>
                <p className="text-2xl font-bold text-purple-700">{weather.visibility}</p>
              </div>
            )}
          </div>

          {/* Agricultural Advisory */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 sm:p-5 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="text-xl mt-1">🌾</div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-1">
                  {t('weather_farming_advisory')}
                </p>
                <p className="text-green-800 text-sm leading-relaxed">
                  {getAgricultureAdvisory(weather.condition, weather.temp)}
                </p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {weather.lastUpdated && (
            <p className="text-xs text-gray-500 text-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
              {t('weather_last_updated')} {new Date(weather.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {advisoriesSection}

      {/* Additional Info Card */}
      <div className="mt-4 sm:mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">{t('weather_tip_label')}</span> {t('weather_tip_text')}
        </p>
      </div>
    </div>
  );
}
