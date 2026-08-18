import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fieldConditionService } from '../../services/fieldConditionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerCropConditions() {
  const { t } = useLanguage();
  const [conditions, setConditions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fieldConditionService.getConditionsForFarmer()
      .then(setConditions)
      .catch((error) => toast.error(error.response?.data?.message || 'Failed to load condition reports.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-[#166534] mb-1">{t('conditions_title')}</h2>
      <p className="text-sm text-gray-600 mb-6">{t('conditions_subtitle')}</p>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : conditions.length === 0 ? (
        <p className="text-sm text-gray-500">{t('conditions_empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {conditions.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
              <p className="font-bold text-gray-900">{c.conditionType}{c.cropType ? ` · ${c.cropType}` : ''}</p>
              <p className="text-sm text-gray-700 mt-1">{c.description}</p>
              {c.recommendation && <p className="text-sm text-[#166534] mt-1">💡 {c.recommendation}</p>}
              <p className="text-xs text-gray-500 mt-2">
                {c.extensionWorker?.fullName ? `${t('conditions_from')} ${c.extensionWorker.fullName} · ` : ''}
                {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
