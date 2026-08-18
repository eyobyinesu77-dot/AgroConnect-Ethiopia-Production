import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { weatherAdvisoryService } from '../../services/weatherAdvisoryService';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

// How far the advisory reaches within the extension worker's own region.
const LOCATION_SCOPES = [
  { value: 'region', label: 'Whole Region' },
  { value: 'zone', label: 'Specific Zone' },
  { value: 'woreda', label: 'Specific Woreda' },
  { value: 'farmers', label: 'Specific Farmer(s)' },
];

export default function ExtensionWeather() {
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
      toast.error(error.response?.data?.message || 'Failed to load your advisories.');
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
      toast.error('Please enter an advisory title.');
      return;
    }
    if (!condition) {
      toast.error('Please select a condition.');
      return;
    }
    if (condition === 'Other' && !customCondition.trim()) {
      toast.error('Please describe the condition.');
      return;
    }
    if (!message.trim()) {
      toast.error('Please write the advisory content for farmers.');
      return;
    }
    if (locationScope === 'farmers' && selectedFarmerIds.length === 0) {
      toast.error('Please select at least one farmer.');
      return;
    }
    if (locationScope !== 'region' && locationScope !== 'farmers' && !locationValue.trim()) {
      toast.error(`Please enter the target ${locationScope}.`);
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
      toast.success('Advisory posted to farmers in your area! 🌦️');
      resetForm();
      loadAdvisories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post advisory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await weatherAdvisoryService.deleteAdvisory(id);
      setAdvisories((prev) => prev.filter((a) => a._id !== id));
      toast.success('Advisory removed.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove advisory.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-[#166534] mb-1">🌦️ Weather Advisories</h2>
      <p className="text-sm text-gray-600 mb-6">
        Post local weather advisories for farmers in {user?.region || 'your region'}. This is separate from
        the live forecast farmers see — use it for on-the-ground guidance (e.g. "heavy rain expected, delay
        fertilizer application").
      </p>

      {/* Advisory posting form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-green-200 p-5 sm:p-6 mb-8 flex flex-col gap-4"
      >
        {/* Title */}
        <div>
          <label htmlFor="advisory-title" className="block text-sm font-medium text-gray-700 mb-1">
            Advisory Title
          </label>
          <input
            id="advisory-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Heavy Rain Warning for This Weekend"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="advisory-condition" className="block text-sm font-medium text-gray-700 mb-1">
            Condition
          </label>
          <select
            id="advisory-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">-- Select Condition --</option>
            {CONDITION_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {condition === 'Other' && (
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder="Describe the condition"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          )}
        </div>

        {/* Location selector — target Region / Zone / Woreda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Location</label>
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
                <option key={scope.value} value={scope.value}>{scope.label}</option>
              ))}
            </select>
            {locationScope !== 'region' && locationScope !== 'farmers' && (
              <input
                type="text"
                value={locationValue}
                onChange={(e) => setLocationValue(e.target.value)}
                placeholder={locationScope === 'zone' ? `e.g. ${user?.zone || 'North Shewa'}` : `e.g. ${user?.woreda || 'Debre Birhan'}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            )}
          </div>
          {locationScope === 'farmers' && (
            farmers.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">You have no assigned farmers yet — ask an admin to assign some.</p>
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
              ? `Reaches every farmer in ${user?.region || 'your region'}.`
              : locationScope === 'farmers'
              ? 'Reaches only the farmer(s) you select above.'
              : `Reaches only farmers whose ${locationScope} matches what you type.`}
          </p>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="advisory-message" className="block text-sm font-medium text-gray-700 mb-1">
            Advisory Content
          </label>
          <textarea
            id="advisory-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Heavy rain expected this weekend — hold off on fertilizer application until conditions clear."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Posting...' : 'Post Advisory'}
        </button>
      </form>

      {/* Previously posted advisories */}
      <h3 className="text-lg font-bold text-[#166534] mb-3">Your Posted Advisories</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label="Loading..." />
      ) : advisories.length === 0 ? (
        <p className="text-sm text-gray-500">You haven't posted any weather advisories yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {advisories.map((advisory) => (
            <div
              key={advisory._id}
              className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex justify-between items-start gap-4"
            >
              <div>
                <p className="font-bold text-gray-900">{advisory.title}</p>
                <p className="text-sm font-medium text-[#166534] mt-0.5">{advisory.condition}</p>
                <p className="text-sm text-gray-700 mt-1">{advisory.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {advisory.targetFarmers?.length > 0 ? (
                    `Sent to: ${advisory.targetFarmers.map((f) => f.fullName).join(', ')}`
                  ) : (
                    <>
                      {advisory.region}
                      {advisory.zone ? ` / Zone: ${advisory.zone}` : ''}
                      {advisory.woreda ? ` / Woreda: ${advisory.woreda}` : ''}
                      {!advisory.zone && !advisory.woreda ? ' (whole region)' : ''}
                    </>
                  )}
                  {' · '}
                  {new Date(advisory.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(advisory._id)}
                disabled={deletingId === advisory._id}
                className="shrink-0 text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
              >
                {deletingId === advisory._id ? '...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
