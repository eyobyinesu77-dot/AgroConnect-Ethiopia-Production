import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer style={{ backgroundColor: '#1b5e20', color: 'white', textAlign: 'center', padding: '1.5rem', marginTop: 'auto' }}>
      <p style={{ margin: 0, fontSize: '0.95rem' }}>
        {t('footer_copyright')}
      </p>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#c8e6c9' }}>
        {t('footer_tagline')}
      </p>
    </footer>
  );
}