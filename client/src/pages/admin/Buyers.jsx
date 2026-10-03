import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, geoJoin } from '../../utils/i18nKeys';
export default function AdminBuyers() {
  const { t } = useLanguage();
  const [buyers, setBuyers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await adminService.getBuyers();
        if (isMounted) setBuyers(data);
      } catch (error) {
        toast.error(t(apiErrorKey(error, 'admin_buyers_load_error', 'admin_buyers_load_error')));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('admin_buyers_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('admin_buyers_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('admin_buyers_subtitle').replace('{count}', buyers.length)}</p>

      {buyers.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_buyers_empty')}</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_name')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_phone')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_location')}</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((f) => (
                <tr key={f._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{f.fullName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{f.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{geoJoin(t, [f.region, f.zone, f.woreda], ' / ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
