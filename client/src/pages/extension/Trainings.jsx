import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trainingService } from '../../services/trainingService';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, geoLabel } from '../../utils/i18nKeys';
export default function ExtensionTrainings() {
  const { t, formatDate } = useLanguage();
  const [trainings, setTrainings] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [targetMode, setTargetMode] = useState('region'); // 'region' | 'zone' | 'farmers'
  const [zone, setZone] = useState('');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);

  const load = async () => {
    try {
      const [trainingsData, farmersData] = await Promise.all([
        trainingService.getMyTrainings(),
        extensionService.getFarmersList(),
      ]);
      setTrainings(trainingsData);
      setFarmers(farmersData);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_train_load_error', 'ext_train_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setLocation('');
    setTargetMode('region');
    setZone('');
    setSelectedFarmerIds([]);
  };

  const toggleFarmer = (id) => {
    setSelectedFarmerIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !date || !location.trim()) {
      toast.error(t('ext_train_fill_err'));
      return;
    }
    if (targetMode === 'farmers' && selectedFarmerIds.length === 0) {
      toast.error(t('common_select_farmer_multi_err'));
      return;
    }

    setIsSubmitting(true);
    try {
      await trainingService.createTraining({
        title: title.trim(),
        description: description.trim(),
        date,
        location: location.trim(),
        zone: targetMode === 'zone' ? zone.trim() || undefined : undefined,
        targetFarmers: targetMode === 'farmers' ? selectedFarmerIds : undefined,
      });
      toast.success(t('ext_train_scheduled'));
      resetForm();
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_train_schedule_error', 'ext_train_schedule_error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await trainingService.deleteTraining(id);
      setTrainings((prev) => prev.filter((tr) => tr._id !== id));
      toast.success(t('ext_train_cancelled'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_train_cancel_error', 'ext_train_cancel_error')));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-[#166534]">{t('trainings_title')}</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? t('common_cancel') : t('ext_train_new')}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">{t('ext_train_subtitle')}</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-green-200 p-5 sm:p-6 mb-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common_title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('ext_train_title_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common_date')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('col_location')}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('ext_train_location_placeholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common_send_to')}</label>
            <select
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="region">{t('common_whole_region')}</option>
              <option value="zone">{t('common_specific_zone')}</option>
              <option value="farmers">{t('common_specific_farmers')}</option>
            </select>

            {targetMode === 'zone' && (
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder={t('common_zone_placeholder')}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            )}

            {targetMode === 'farmers' && (
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('ext_train_desc')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('ext_train_desc_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? t('ext_train_scheduling') : t('ext_train_submit')}
          </button>
        </form>
      )}

      <h3 className="text-lg font-bold text-[#166534] mb-3">{t('ext_train_list_title')}</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : trainings.length === 0 ? (
        <p className="text-sm text-gray-500">{t('ext_train_empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {trainings.map((tr) => (
            <div key={tr._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-gray-900">{tr.title}</p>
                <p className="text-sm text-gray-700 mt-1">{tr.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  📅 {formatDate(tr.date)} · 📍 {tr.location} ·{' '}
                  {tr.targetFarmers?.length > 0
                    ? t('common_sent_to').replace('{names}', tr.targetFarmers.map((f) => f.fullName).join(', '))
                    : (geoLabel(t, tr.zone) || t('common_whole_region_lower'))}
                </p>
              </div>
              <button
                onClick={() => handleDelete(tr._id)}
                disabled={deletingId === tr._id}
                className="shrink-0 text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50 disabled:opacity-60 px-3 py-1.5 rounded-lg"
              >
                {deletingId === tr._id ? '...' : t('common_cancel')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
