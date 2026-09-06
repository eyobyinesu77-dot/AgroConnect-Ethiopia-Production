import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // 'idle' -> no token in the URL yet (just registered, told to check inbox)
  // 'verifying' -> real request in flight
  // 'success' / 'error' -> real response received
  const [status, setStatus] = useState(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    // Real request: GET /api/auth/verify-email/:token -> Express route ->
    // authController.verifyEmail -> hashes the token, looks it up in
    // MongoDB, checks expiry, and flips isEmailVerified. Status only
    // becomes 'success' on an actual 2xx response.
    authService
      .verifyEmail(token)
      .then((data) => {
        if (cancelled) return;
        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully.');
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(error.response?.data?.message || 'This verification link is invalid or has expired.');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setIsResending(true);
    try {
      const data = await authService.resendVerification(resendEmail);
      toast.success(data.message || 'If that email is registered and not yet verified, a new link has been sent.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send the verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        {status === 'idle' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem' }}>Verify Your Email</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              A verification email has been sent to your address. Please open it and click the link to activate your account.
            </p>
          </>
        )}

        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem' }}>Verifying...</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Please wait while we confirm your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem' }}>Email Verified</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#c62828', marginTop: 0, marginBottom: '1rem' }}>Verification Failed</h2>
            <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>{message}</p>

            <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ color: '#333', fontSize: '0.85rem' }}>Resend verification link</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                disabled={isResending}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
              <button
                type="submit"
                disabled={isResending}
                style={{ backgroundColor: isResending ? '#7fa982' : '#2e7d32', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '4px', fontWeight: 'bold', cursor: isResending ? 'not-allowed' : 'pointer' }}
              >
                {isResending ? 'Sending...' : 'Resend Link'}
              </button>
            </form>
          </>
        )}

        <Link
          to="/login"
          style={{ backgroundColor: '#2e7d32', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-block' }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
