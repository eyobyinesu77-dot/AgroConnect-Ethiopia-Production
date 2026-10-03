import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, geoJoin } from '../../utils/i18nKeys';
export default function AdminFarmers() {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState([]);
  const [extensionWorkers, setExtensionWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  const load = async () => {
    try {
      const [farmersData, workersData] = await Promise.all([
        adminService.getFarmers(),
        adminService.getExtensionWorkers(),
      ]);
      setFarmers(farmersData);
      setExtensionWorkers(workersData);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_farmers_load_error', 'admin_farmers_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAssign = async (farmerId, extensionWorkerId) => {
    setAssigningId(farmerId);
    try {
      const result = await adminService.assignExtensionWorker(farmerId, extensionWorkerId || null);
      setFarmers((prev) => prev.map((f) => (f._id === farmerId ? result.farmer : f)));
      toast.success(extensionWorkerId ? t('admin_farmers_assigned_ok') : t('admin_farmers_unassigned_ok'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_farmers_assign_error', 'admin_farmers_assign_error')));
    } finally {
      setAssigningId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('admin_farmers_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('admin_farmers_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        {t('admin_farmers_subtitle').replace('{count}', farmers.length)}
      </p>

      {farmers.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_farmers_empty')}</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_name')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_phone')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_location')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('admin_farmers_col_assigned')}</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{f.fullName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{f.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{geoJoin(t, [f.region, f.zone, f.woreda], ' / ')}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={f.assignedExtensionWorker?._id || ''}
                      onChange={(e) => handleAssign(f._id, e.target.value)}
                      disabled={assigningId === f._id}
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', minWidth: '180px' }}
                    >
                      <option value="">{t('admin_farmers_unassigned')}</option>
                      {extensionWorkers.map((w) => (
                        <option key={w._id} value={w._id}>{w.fullName}</option>
                      ))}
                    </select>
                  </td>
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
