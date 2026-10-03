import React from 'react';
import ProfileForm from '../../components/common/ProfileForm';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerProfile() {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1.5rem' }}>{t('profile_title')}</h2>
      <ProfileForm extraFields={['primaryCrop', 'farmSize', 'farmLocation']} />
    </div>
  );
}
