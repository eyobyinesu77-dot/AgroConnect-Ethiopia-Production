import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { logisticsService } from '../../services/logisticsService';
import { logisticsRegions } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, dataLabel } from '../../utils/i18nKeys';
// Read-only, filterable Transport Provider Directory shared by the farmer
// and buyer Logistics pages.
export default function ProviderDirectory() {
  const { t, formatNumber } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    logisticsService
      .getProviders(region ? { region } : {})
      .then((data) => mounted && setProviders(data))
      .catch((err) => toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error'))))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [region]);

  return (
    <div>
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        aria-label={t('lg_dir_filter_region')}
        style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' }}
      >
        <option value="">{t('lg_dir_all')}</option>
        {logisticsRegions.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      {loading ? (
        <p style={{ color: '#666' }}>{t('common_loading')}</p>
      ) : providers.length === 0 ? (
        <p style={{ color: '#666' }}>{t('lg_dir_empty')}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {providers.map((p) => (
            <div key={p._id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem' }}>
                <strong style={{ color: '#1b5e20' }}>{p.name}</strong>
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '10px', backgroundColor: p.isAvailable ? '#e8f5e9' : '#eee', color: p.isAvailable ? '#2e7d32' : '#777' }}>
                  {p.isAvailable ? t('lg_available') : t('lg_unavailable')}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0 0.2rem', fontSize: '0.85rem', color: '#444' }}>{t('lg_vehicle')}: {dataLabel(t, 'vehicle', p.vehicleType)}</p>
              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#444' }}>{t('lg_capacity')}: {formatNumber(p.capacityKg)} {t('unit_kg')}</p>
              {p.ratePerQuintalPerKm != null && (
                <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#444' }}>{t('lg_rate')}: {p.ratePerQuintalPerKm}</p>
              )}
              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#444' }}>{t('lg_regions_served')}: {p.regionsServed.join(', ')}</p>
              {p.notes && <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#777' }}>{p.notes}</p>}
              <a href={`tel:${p.phone}`} style={{ display: 'inline-block', marginTop: '0.5rem', color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none' }}>
                📞 {t('lg_call')} {p.phone}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
