import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey } from '../../utils/i18nKeys';
export default function PasswordSettingsForm() {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error(t('pw_min'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('pw_mismatch'));
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword(newPassword);
      toast.success(t('pw_success'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'pw_error', 'pw_error')));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '450px' }}
    >
      <h3 style={{ margin: 0, color: '#1b5e20', fontSize: '1.05rem' }}>{t('pw_title')}</h3>
      <div>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('pw_new')}</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('pw_confirm')}</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
      >
        {isSaving ? t('pw_updating') : t('pw_update')}
      </button>
    </form>
  );
}
