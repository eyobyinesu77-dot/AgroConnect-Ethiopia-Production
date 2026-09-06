import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

export default function ResetPassword() {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // The reset token travels only as a URL query param, e.g.
  // http://localhost:5173/reset-password?token=<raw token from the email>.
  // It is never hardcoded and never guessed client-side.
  const token = searchParams.get('token');

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('This reset link is missing its token. Please use the link from your email.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Real request: POST /api/auth/reset-password { token, password } ->
      // Express route -> authController.resetPassword -> hashes the token,
      // looks it up in MongoDB, verifies expiry, bcrypt-hashes the new
      // password, saves it, and invalidates the token. Only a genuine 2xx
      // response from that chain reaches the toast.success below.
      const data = await authService.resetPassword(token, passwords.newPassword);
      toast.success(data.message || 'Your password has been reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not reset your password. The link may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ color: '#c62828', marginTop: 0, marginBottom: '1rem' }}>⚠️ Invalid Reset Link</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            This link is missing a reset token. Please request a new password reset link.
          </p>
          <Link to="/forgot-password" style={{ color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none' }}>Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>🔒 Choose a New Password</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>New Password</label>
            <input
              type="password"
              name="newPassword"
              placeholder="********"
              value={passwords.newPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="********"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ backgroundColor: isSubmitting ? '#7fa982' : '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
