import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { weatherAdvisoryService } from '../../services/weatherAdvisoryService';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, tOr, geoLabel } from '../../utils/i18nKeys';
// API values (stored in the database) — display labels come from translations.
const CONDITION_OPTIONS = [
  'Heavy Rain Expected',
  'Drought Risk',
  'Frost Warning',
  'Strong Winds',
  'Clear Skies — Good for Fieldwork',
  'Hail Risk',
  'Flood Risk',
  'Other',
];
const CONDITION_LABEL_KEYS = {
  'Heavy Rain Expected': 'wcond_heavy_rain',
  'Drought Risk': 'wcond_drought',
  'Frost Warning': 'wcond_frost',
  'Strong Winds': 'wcond_wind',
  'Clear Skies — Good for Fieldwork': 'wcond_clear',
  'Hail Risk': 'wcond_hail',
  'Flood Risk': 'wcond_flood',
  'Other': 'wcond_other',
};

// How far the advisory reaches within the extension worker's own region.
const LOCATION_SCOPES = [
  { value: 'region', labelKey: 'scope_region' },
  { value: 'zone', labelKey: 'scope_zone' },
  { value: 'woreda', labelKey: 'scope_woreda' },
  { value: 'farmers', labelKey: 'scope_farmers' },
];

export default function ExtensionWeather() {
  const { t, formatDate } = useLanguage();
  const { user } = useAuth();
  const [advisories, setAdvisories] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [locationScope, setLocationScope] = useState('region');
  const [locationValue, setLocationValue] = useState('');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
  const [condition, setCondition] = useState('');
  const [customCondition, setCustomCondition] = useState('');

  const loadAdvisories = async () => {
    try {
      const [advisoriesData, farmersData] = await Promise.all([
        weatherAdvisoryService.getMyAdvisories(),
        extensionService.getFarmersList(),
      ]);
      setAdvisories(advisoriesData);
      setFarmers(farmersData);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_weather_load_error', 'ext_weather_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisories();
  }, []);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setLocationScope('region');
    setLocationValue('');
    setSelectedFarmerIds([]);
    setCondition('');
    setCustomCondition('');
  };

  const toggleFarmer = (id) => {
    setSelectedFarmerIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t('ext_weather_title_err'));
      return;
    }
    if (!condition) {
      toast.error(t('ext_weather_condition_err'));
      return;
    }
    if (condition === 'Other' && !customCondition.trim()) {
      toast.error(t('ext_weather_custom_condition_err'));
      return;
    }
    if (!message.trim()) {
      toast.error(t('ext_weather_content_err'));
      return;
    }
    if (locationScope === 'farmers' && selectedFarmerIds.length === 0) {
      toast.error(t('common_select_farmer_multi_err'));
      return;
    }
    if (locationScope !== 'region' && locationScope !== 'farmers' && !locationValue.trim()) {
      toast.error(t('ext_weather_target_err').replace('{scope}', locationScope));
      return;
    }

    const finalCondition = condition === 'Other' ? customCondition.trim() : condition;

    setIsSubmitting(true);
    try {
      await weatherAdvisoryService.createAdvisory({
        title: title.trim(),
        region: user?.region,
        zone: locationScope === 'zone' ? locationValue.trim() : undefined,
        woreda: locationScope === 'woreda' ? locationValue.trim() : undefined,
        targetFarmers: locationScope === 'farmers' ? selectedFarmerIds : undefined,
        condition: finalCondition,
        message: message.trim(),
      });
      toast.success(t('ext_weather_posted'));
      resetForm();
      loadAdvisories();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_weather_post_error', 'ext_weather_post_error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await weatherAdvisoryService.deleteAdvisory(id);
      setAdvisories((prev) => prev.filter((a) => a._id !== id));
      toast.success(t('ext_weather_removed'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_weather_remove_error', 'ext_weather_remove_error')));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-[#166534] mb-1">{t('ext_weather_page_title')}</h2>
      <p className="text-sm text-gray-600 mb-6">
        {t('ext_weather_page_intro', { region: user?.region || t('ext_weather_your_region') })}
      </p>

      {/* Advisory posting form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-green-200 p-5 sm:p-6 mb-8 flex flex-col gap-4"
      >
        {/* Title */}
        <div>
          <label htmlFor="advisory-title" className="block text-sm font-medium text-gray-700 mb-1">
            {t('ext_weather_advisory_title_label')}
          </label>
          <input
            id="advisory-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('ext_weather_title_placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="advisory-condition" className="block text-sm font-medium text-gray-700 mb-1">
            {t('ext_weather_condition_label')}
          </label>
          <select
            id="advisory-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">{t('ext_weather_select_condition')}</option>
            {CONDITION_OPTIONS.map((c) => (
              <option key={c} value={c}>{t(CONDITION_LABEL_KEYS[c])}</option>
            ))}
          </select>
          {condition === 'Other' && (
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder={t('ext_weather_describe_condition')}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          )}
        </div>

        {/* Location selector — target Region / Zone / Woreda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('ext_weather_target_location')}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={locationScope}
              onChange={(e) => {
                setLocationScope(e.target.value);
                setLocationValue('');
              }}
              className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {LOCATION_SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>{t(scope.labelKey)}</option>
              ))}
            </select>
            {locationScope !== 'region' && locationScope !== 'farmers' && (
              <input
                type="text"
                value={locationValue}
                onChange={(e) => setLocationValue(e.target.value)}
                placeholder={locationScope === 'zone' ? t('addr_zone') : t('addr_woreda')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            )}
          </div>
          {locationScope === 'farmers' && (
            farmers.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">{t('common_no_assigned_farmers')}</p>
            ) : (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {farmers.map((f) => (
                  <label key={f._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedFarmerIds.includes(f._id)}
                      onChange={() => toggleFarmer(f._id)}
                      className="accent-green-600"
                    />
                    {f.fullName}{f.phone ? ` (${f.phone})` : ''}
                  </label>
                ))}
              </div>
            )
          )}
          <p className="text-xs text-gray-500 mt-1">
            {locationScope === 'region'
              ? t('ext_weather_reaches_region').replace('{region}', user?.region || t('ext_weather_your_region'))
              : locationScope === 'farmers'
              ? t('ext_weather_reaches_farmers')
              : t('ext_weather_reaches_scope').replace('{scope}', locationScope)}
          </p>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="advisory-message" className="block text-sm font-medium text-gray-700 mb-1">
            {t('ext_weather_content_label')}
          </label>
          <textarea
            id="advisory-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('ext_weather_content_placeholder')}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {isSubmitting ? t('ext_weather_posting') : t('ext_weather_post')}
        </button>
      </form>

      {/* Previously posted advisories */}
      <h3 className="text-lg font-bold text-[#166534] mb-3">{t('ext_weather_list_title')}</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : advisories.length === 0 ? (
        <p className="text-sm text-gray-500">{t('ext_weather_empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {advisories.map((advisory) => (
            <div
              key={advisory._id}
              className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex justify-between items-start gap-4"
            >
              <div>
                <p className="font-bold text-gray-900">{advisory.title}</p>
                <p className="text-sm font-medium text-[#166534] mt-0.5">{tOr(t, CONDITION_LABEL_KEYS[advisory.condition], advisory.condition)}</p>
                <p className="text-sm text-gray-700 mt-1">{advisory.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {advisory.targetFarmers?.length > 0 ? (
                    `${t('wadv_sent_to')} ${advisory.targetFarmers.map((f) => f.fullName).join(', ')}`
                  ) : (
                    <>
                      {geoLabel(t, advisory.region)}
                      {advisory.zone ? ` / ${t('wadv_zone')}: ${geoLabel(t, advisory.zone)}` : ''}
                      {advisory.woreda ? ` / ${t('wadv_woreda')}: ${geoLabel(t, advisory.woreda)}` : ''}
                      {!advisory.zone && !advisory.woreda ? ` ${t('wadv_whole_region')}` : ''}
                    </>
                  )}
                  {' · '}
                  {formatDate(advisory.createdAt)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(advisory._id)}
                disabled={deletingId === advisory._id}
                className="shrink-0 text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
              >
                {deletingId === advisory._id ? '...' : t('common_remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
