import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey } from '../../utils/i18nKeys';
const FIELD_LABEL_KEYS = {
  fullName: 'profile_full_name',
  phone: 'profile_phone',
  region: 'profile_region',
  zone: 'profile_zone',
  woreda: 'profile_woreda',
  kebele: 'profile_kebele',
};

export default function ProfileForm({ extraFields = [] }) {
  const { t } = useLanguage();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await userService.getProfile();
        if (isMounted) {
          setProfile(data);
          setFormData(data);
        }
      } catch (error) {
        toast.error(t(apiErrorKey(error, 'profile_load_error', 'profile_load_error')));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fields = ['fullName', 'phone', 'region', 'zone', 'woreda', 'kebele', ...extraFields];
      const payload = {};
      fields.forEach((f) => { if (formData[f] !== undefined) payload[f] = formData[f]; });

      const updated = await userService.updateProfile(payload);
      setProfile(updated);
      updateUser({ name: updated.fullName });
      toast.success(t('profile_updated'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'profile_update_error', 'profile_update_error')));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('profile_loading')} />;
  }

  const baseFields = ['fullName', 'phone', 'region', 'zone', 'woreda', 'kebele'];

  return (
    <form
      onSubmit={handleSubmit}
      style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}
    >
      <div style={{ marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #eee' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#999' }}>{t('profile_email_readonly')}</p>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{profile?.email}</p>
      </div>

      {[...baseFields, ...extraFields].map((field) => (
        <div key={field}>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
            {FIELD_LABEL_KEYS[field] ? t(FIELD_LABEL_KEYS[field]) : field}
          </label>
          <input
            type="text"
            name={field}
            value={formData[field] || ''}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isSaving}
        style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
      >
        {isSaving ? t('profile_saving') : t('profile_save')}
      </button>
    </form>
  );
}
