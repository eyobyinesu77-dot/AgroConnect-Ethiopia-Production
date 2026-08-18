import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trainingService } from '../../services/trainingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerTrainings() {
  const { t } = useLanguage();
  const [trainings, setTrainings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trainingService.getTrainingsForFarmer()
      .then(setTrainings)
      .catch((error) => toast.error(error.response?.data?.message || 'Failed to load trainings.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-[#166534] mb-1">{t('trainings_title')}</h2>
      <p className="text-sm text-gray-600 mb-6">{t('trainings_subtitle')}</p>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : trainings.length === 0 ? (
        <p className="text-sm text-gray-500">{t('trainings_empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {trainings.map((t2) => (
            <div key={t2._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
              <p className="font-bold text-gray-900">{t2.title}</p>
              <p className="text-sm text-gray-700 mt-1">{t2.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                📅 {new Date(t2.date).toLocaleDateString()} · 📍 {t2.location}
                {t2.extensionWorker?.fullName ? ` · ${t('trainings_hosted_by')} ${t2.extensionWorker.fullName}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
