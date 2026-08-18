import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerVisits() {
  const { t } = useLanguage();
  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    extensionService.getVisitsForFarmer()
      .then(setVisits)
      .catch((error) => toast.error(error.response?.data?.message || 'Failed to load visit history.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-[#166534] mb-1">{t('visits_title')}</h2>
      <p className="text-sm text-gray-600 mb-6">{t('visits_subtitle')}</p>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : visits.length === 0 ? (
        <p className="text-sm text-gray-500">{t('visits_empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visits.map((v) => (
            <div key={v._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
              <p className="text-sm text-gray-700">{v.notes}</p>
              <p className="text-xs text-gray-500 mt-2">
                📅 {new Date(v.visitDate).toLocaleDateString()}
                {v.extensionWorker?.fullName ? ` · ${t('visits_visited_by')} ${v.extensionWorker.fullName}` : ''}
                {v.extensionWorker?.phone ? ` (${v.extensionWorker.phone})` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
