import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey } from '../../utils/i18nKeys';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await authService.forgotPassword(email);
      setStatus('done');
    } catch (err) {
      setError(apiErrorKey(err, 'auth_generic_error', 'auth_generic_error'));
      setStatus('error');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>{t('forgot_title')}</h2>

        {status === 'done' ? (
          <p style={{ color: '#2e7d32', fontSize: '0.95rem', textAlign: 'center' }}>
            {t('forgot_sent')}
          </p>
        ) : (
          <>
            <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              {t('forgot_prompt')}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>{t('auth_email_plain')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>

              {error && <p style={{ color: '#c62828', fontSize: '0.85rem', margin: 0 }}>{t(error)}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: status === 'loading' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, marginTop: '0.5rem' }}
              >
                {status === 'loading' ? t('forgot_sending') : t('forgot_submit')}
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
          {t('forgot_back')} <Link to="/login" style={{ color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none' }}>{t('forgot_login_link')}</Link>
        </p>
      </div>
    </div>
  );
}
