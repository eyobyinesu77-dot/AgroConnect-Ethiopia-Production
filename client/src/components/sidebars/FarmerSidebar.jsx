import React from 'react';
import SidebarLink from '../common/SidebarLink';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerSidebar() {
  const { language, setLanguage, t } = useLanguage();

  const links = [
    { to: '/farmer/dashboard', label: t('nav_dashboard'), icon: '🏠' },
    { to: '/farmer/products', label: t('nav_my_products'), icon: '🌾' },
    { to: '/farmer/sell-crop', label: t('nav_sell_crop'), icon: '➕' },
    { to: '/farmer/orders', label: t('nav_incoming_orders'), icon: '🧾' },
    { to: '/farmer/loans', label: t('nav_loans'), icon: '💰' },
    { to: '/farmer/weather', label: t('nav_weather'), icon: '🌦️' },
    { to: '/farmer/advice', label: t('nav_advice'), icon: '💡' },
    { to: '/farmer/crop-conditions', label: t('nav_crop_conditions'), icon: '🌾' },
    { to: '/farmer/trainings', label: t('nav_trainings'), icon: '🎓' },
    { to: '/farmer/visits', label: t('nav_visits'), icon: '🚜' },
    { to: '/farmer/messages', label: t('nav_messages'), icon: '💬' },
    { to: '/farmer/profile', label: t('nav_profile'), icon: '👤' },
    { to: '/farmer/settings', label: t('nav_settings'), icon: '⚙️' },
  ];

  return (
    <>
      {/* Language toggle — English / Amharic, persisted for this farmer's browser */}
      <div className="flex items-center gap-1 mb-3 p-1 bg-green-100 rounded-lg text-sm font-semibold">
        <button
          onClick={() => setLanguage('en')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            language === 'en' ? 'bg-white text-[#166534] shadow-sm' : 'text-green-800'
          }`}
        >
          {t('language_en')}
        </button>
        <button
          onClick={() => setLanguage('am')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            language === 'am' ? 'bg-white text-[#166534] shadow-sm' : 'text-green-800'
          }`}
        >
          {t('language_am')}
        </button>
      </div>

      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
