import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 text-center px-4">
      <span className="text-6xl mb-4">🌾</span>
      <h1 className="text-4xl font-bold text-green-800 mb-2">404</h1>
      <p className="text-gray-600 mb-6">
        {t('notfound_text')}
      </p>
      <Link
        to="/"
        className="bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2.5 rounded-lg"
      >
        {t('notfound_back')}
      </Link>
    </div>
  );
}
