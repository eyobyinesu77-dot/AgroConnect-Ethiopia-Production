import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function SearchBar({ searchTerm, setSearchTerm, placeholder }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', width: '100%', maxWidth: '400px', margin: '1rem 0' }}>
      <input 
        type="text" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder={placeholder ?? t('search_placeholder')}
        aria-label={placeholder ?? t('search_placeholder')}
        style={{ width: '100%', padding: '0.7rem', borderRadius: '4px 0 0 4px', border: '1px solid #ccc', outline: 'none' }}
      />
      <button style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0 1.2rem', borderRadius: '0 4px 4px 0', fontWeight: 'bold', cursor: 'pointer' }}>
        {t('search_button')}
      </button>
    </div>
  );
}