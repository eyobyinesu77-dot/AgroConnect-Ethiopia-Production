import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adviceService } from '../../services/adviceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerAdvice() {
  const { t } = useLanguage();
  const [adviceList, setAdviceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adviceService.getAdviceForFarmer()
      .then(setAdviceList)
      .catch((error) => toast.error(error.response?.data?.message || 'Failed to load advice.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-[#166534] mb-1">{t('advice_title')}</h2>
      <p className="text-sm text-gray-600 mb-6">{t('advice_subtitle')}</p>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : adviceList.length === 0 ? (
        <p className="text-sm text-gray-500">{t('advice_empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {adviceList.map((a) => (
            <div key={a._id} className="bg-white rounded-xl shadow-sm border border-green-200 p-4">
              <p className="font-bold text-gray-900">{a.title}</p>
              {a.cropType && <p className="text-sm font-medium text-[#166534] mt-0.5">🌾 {a.cropType}</p>}
              <p className="text-sm text-gray-700 mt-1">{a.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                {a.extensionWorker?.fullName ? `${t('advice_from')} ${a.extensionWorker.fullName} · ` : ''}
                {new Date(a.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
