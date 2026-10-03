import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import PasswordSettingsForm from '../../components/common/PasswordSettingsForm';

export default function AdminSettings() {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1.5rem' }}>{t('settings_title')}</h2>
      <PasswordSettingsForm />
    </div>
  );
}
