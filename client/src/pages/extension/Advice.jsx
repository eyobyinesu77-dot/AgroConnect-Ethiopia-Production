import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adviceService } from '../../services/adviceService';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { cropTypes } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, geoLabel, dataLabel } from '../../utils/i18nKeys';
export default function ExtensionAdvice() {
  const { t, formatDate } = useLanguage();
  const [adviceList, setAdviceList] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cropType, setCropType] = useState('');
  const [targetMode, setTargetMode] = useState('region'); // 'region' | 'zone' | 'farmers'
  const [zone, setZone] = useState('');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);

  const load = async () => {
    try {
      const [adviceData, farmersData] = await Promise.all([
        adviceService.getMyAdvice(),
        extensionService.getFarmersList(),
      ]);
      setAdviceList(adviceData);
      setFarmers(farmersData);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_advice_load_error', 'ext_advice_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCropType('');
    setTargetMode('region');
    setZone('');
    setSelectedFarmerIds([]);
  };

  const toggleFarmer = (id) => {
    setSelectedFarmerIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error(t('ext_advice_fill_err'));
      return;
    }
    if (targetMode === 'farmers' && selectedFarmerIds.length === 0) {
      toast.error(t('common_select_farmer_multi_err'));
      return;
    }

    setIsSubmitting(true);
    try {
      await adviceService.createAdvice({
        title: title.trim(),
        content: content.trim(),
        cropType: cropType || undefined,
        zone: targetMode === 'zone' ? zone.trim() || undefined : undefined,
        targetFarmers: targetMode === 'farmers' ? selectedFarmerIds : undefined,
      });
      toast.success(t('ext_advice_posted'));
      resetForm();
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_advice_post_error', 'ext_advice_post_error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await adviceService.deleteAdvice(id);
      setAdviceList((prev) => prev.filter((a) => a._id !== id));
      toast.success(t('ext_advice_removed'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_advice_remove_error', 'ext_advice_remove_error')));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-[#166534]">{t('advice_title')}</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? t('common_cancel') : `+ ${t('qa_create_advice')}`}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">{t('ext_advice_subtitle')}</p>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-green-200 p-5 sm:p-6 mb-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common_title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('ext_advice_title_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('ext_advice_crop_type')} <span className="text-gray-400">{t('ext_advice_crop_optional')}</span></label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">{t('ext_advice_general')}</option>
              {cropTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('ext_advice_content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('ext_advice_content_placeholder')}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSubmitting ? t('ext_advice_posting') : t('ext_advice_post')}
          </button>
        </form>
      )}

      <h3 className="text-lg font-bold text-[#166534] mb-3">{t('ext_advice_list_title')}</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : adviceList.length === 0 ? (
        <p className="text-sm text-gray-500">{t('ext_advice_empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {adviceList.map((a) => (
            <div key={a._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-bold text-gray-900">{a.title}</p>
                {a.cropType && <p className="text-sm font-medium text-[#166534] mt-0.5">🌾 {dataLabel(t, 'crop', a.cropType)}</p>}
                <p className="text-sm text-gray-700 mt-1">{a.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {a.targetFarmers?.length > 0
                    ? t('common_sent_to').replace('{names}', a.targetFarmers.map((f) => f.fullName).join(', '))
                    : `${geoLabel(t, a.region)}${a.zone ? ` / ${geoLabel(t, a.zone)}` : ` ${t('common_whole_region_paren')}`}`}
                  {' · '}{formatDate(a.createdAt)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a._id)}
                disabled={deletingId === a._id}
                className="shrink-0 text-xs font-medium text-red-600 border border-red-600 hover:bg-red-50 disabled:opacity-60 px-3 py-1.5 rounded-lg"
              >
                {deletingId === a._id ? '...' : t('common_remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
