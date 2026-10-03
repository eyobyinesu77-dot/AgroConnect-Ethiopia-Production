import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddressDropdown from '../../components/common/AddressDropdown';
import { validateExtensionWorkerPhone } from '../../utils/validation';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, geoJoin } from '../../utils/i18nKeys';
export default function AdminExtensionWorkers() {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [formData, setFormData] = useState({
    email: '', phone: '', region: '', zone: '', woreda: '', kebele: '',
  });
  const [phoneError, setPhoneError] = useState('');

  const loadWorkers = async () => {
    try {
      const data = await adminService.getExtensionWorkers();
      setWorkers(data);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_ext_load_error', 'admin_ext_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'phone') {
      if (!value) {
        setPhoneError(t('admin_ext_phone_required'));
      } else if (!validateExtensionWorkerPhone(value)) {
        setPhoneError(t('admin_ext_phone_invalid'));
      } else {
        setPhoneError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.region || !formData.zone || !formData.woreda) {
      toast.error(t('admin_ext_required_fields'));
      return;
    }

    if (!formData.phone) {
      setPhoneError(t('admin_ext_phone_required'));
      toast.error(t('admin_ext_phone_required'));
      return;
    }
    if (!validateExtensionWorkerPhone(formData.phone)) {
      setPhoneError(t('admin_ext_phone_invalid'));
      toast.error(t('admin_ext_valid_phone_before_submit'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adminService.createExtensionWorker(formData);
      setCreatedCredentials({ email: formData.email, password: result.temporaryPassword });
      setFormData({ email: '', phone: '', region: '', zone: '', woreda: '', kebele: '' });
      setPhoneError('');
      loadWorkers();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_ext_create_error', 'admin_ext_create_error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#1b5e20', margin: 0 }}>{t('admin_ext_title')}</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setCreatedCredentials(null); setPhoneError(''); }}
          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {showForm ? t('common_cancel') : t('admin_ext_new')}
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('admin_ext_subtitle').replace('{count}', workers.length)}</p>

      {createdCredentials && (
        <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#e65100' }}>{t('admin_ext_created_banner')}</p>
          <p style={{ margin: '0.4rem 0 0 0' }}>{t('col_email')}: <strong>{createdCredentials.email}</strong></p>
          <p style={{ margin: 0 }}>{t('admin_ext_temp_password').split(':')[0].trim()}: <strong>{createdCredentials.password}</strong></p>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#a1622d' }}>{t('admin_ext_must_change')}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Free-text fields per spec: Email address and phone number are plain text inputs, not dropdowns. */}
            <input name="email" type="email" placeholder={t('admin_ext_email_ph')} value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            <div>
              <input
                name="phone"
                type="tel"
                placeholder={t('admin_ext_phone_ph')}
                value={formData.phone}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: `1px solid ${phoneError ? '#c62828' : '#ccc'}`, boxSizing: 'border-box' }}
              />
              {phoneError && (
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#c62828' }}>{phoneError}</p>
              )}
            </div>
          </div>

          {/* Cascading Region -> Zone -> Woreda -> Kebele picker covering all 9 Regional States. */}
          <AddressDropdown
            value={{ region: formData.region, zone: formData.zone, woreda: formData.woreda, kebele: formData.kebele }}
            onChange={(loc) => setFormData((prev) => ({ ...prev, ...loc }))}
          />

          <button
            type="submit"
            disabled={isSubmitting || !formData.phone || !validateExtensionWorkerPhone(formData.phone)}
            style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '4px', fontWeight: 'bold', cursor: (isSubmitting || !formData.phone || !validateExtensionWorkerPhone(formData.phone)) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !formData.phone || !validateExtensionWorkerPhone(formData.phone)) ? 0.7 : 1 }}
          >
            {isSubmitting ? t('admin_ext_creating') : t('admin_ext_create')}
          </button>
        </form>
      )}

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : workers.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_ext_empty')}</p>
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
              {workers.map((w) => (
                <tr key={w._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{w.fullName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{w.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{geoJoin(t, [w.region, w.zone, w.woreda], ' / ')}</td>
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
