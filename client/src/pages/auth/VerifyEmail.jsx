import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useLanguage } from '../../context/LanguageContext';
import { apiErrorKey } from '../../utils/i18nKeys';

export default function VerifyEmail() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'no-token'); // loading | done | error | no-token
  const [message, setMessage] = useState('');

  // Resend-verification form state (shown when there's no token, or the
  // token turned out to be invalid/expired).
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('idle'); // idle | loading | done

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authService
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus('done');
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error');
          setMessage(apiErrorKey(err, 'verify_invalid_body', 'verify_invalid_body'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus('loading');
    try {
      await authService.resendVerification(email);
    } finally {
      setResendStatus('done');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {status === 'done' ? '✅' : status === 'error' ? '⚠️' : '✉️'}
        </div>

        {status === 'loading' && (
          <>
            <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem' }}>{t('verify_loading_title')}</h2>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>{t('verify_wait')}</p>
          </>
        )}

        {status === 'done' && (
          <>
            <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem' }}>{t('verify_done_title')}</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              {t('verify_done_body')}
            </p>
            <Link
              to="/login"
              style={{ backgroundColor: '#2e7d32', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-block' }}
            >
              {t('verify_back_login')}
            </Link>
          </>
        )}

        {(status === 'error' || status === 'no-token') && (
          <>
            <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem' }}>
              {status === 'no-token' ? t('verify_notoken_title') : t('verify_invalid_title')}
            </h2>
            <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              {status === 'no-token'
                ? t('verify_notoken_body')
                : t(message)}
            </p>

            {resendStatus === 'done' ? (
              <p style={{ color: '#2e7d32', fontSize: '0.9rem' }}>
                {t('verify_resend_done')}
              </p>
            ) : (
              <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input
                  type="email"
                  placeholder={t('verify_email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
                <button
                  type="submit"
                  disabled={resendStatus === 'loading'}
                  style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: resendStatus === 'loading' ? 0.7 : 1 }}
                >
                  {resendStatus === 'loading' ? t('forgot_sending') : t('verify_resend')}
                </button>
              </form>
            )}

            <Link to="/login" style={{ color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}>
              {t('verify_back_login')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
