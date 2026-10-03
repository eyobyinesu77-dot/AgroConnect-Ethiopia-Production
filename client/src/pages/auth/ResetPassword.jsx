import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey } from '../../utils/i18nKeys';

export default function ResetPassword() {
  const { t } = useLanguage();
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('reset_err_no_token');
      return;
    }
    if (passwords.newPassword.length < 8) {
      setError('reset_err_min8');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('auth_passwords_mismatch');
      return;
    }

    setStatus('loading');
    try {
      await authService.resetPassword(token, passwords.newPassword);
      setStatus('done');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(apiErrorKey(err, 'reset_failed', 'reset_failed'));
      setStatus('error');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>{t('reset_title')}</h2>

        {!token && (
          <p style={{ color: '#c62828', fontSize: '0.9rem', textAlign: 'center' }}>
            {t('reset_missing_token_banner')}{' '}
            <Link to="/forgot-password" style={{ color: '#2e7d32', fontWeight: 'bold' }}>{t('reset_request_new')}</Link>.
          </p>
        )}

        {status === 'done' ? (
          <p style={{ color: '#2e7d32', fontSize: '0.95rem', textAlign: 'center' }}>
            {t('reset_done')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>{t('auth_new_password')}</label>
              <input
                type="password"
                name="newPassword"
                placeholder={t("reset_password_mask")}
                value={passwords.newPassword}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>{t('auth_confirm_password')}</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder={t("reset_password_mask")}
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            {error && <p style={{ color: '#c62828', fontSize: '0.85rem', margin: 0 }}>{t(error)}</p>}

            <button
              type="submit"
              disabled={status === 'loading' || !token}
              style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: (status === 'loading' || !token) ? 'default' : 'pointer', opacity: (status === 'loading' || !token) ? 0.7 : 1, marginTop: '0.5rem' }}
            >
              {status === 'loading' ? t('reset_submitting') : t('reset_submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
