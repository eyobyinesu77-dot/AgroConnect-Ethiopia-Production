import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function LoadingSpinner({ fullScreen = true, label }) {
  const { t } = useLanguage();
  const text = label ?? t('common_loading');
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {content}
    </div>
  );
}
