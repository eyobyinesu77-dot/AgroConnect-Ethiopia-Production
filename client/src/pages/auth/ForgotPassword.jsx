import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Mail } from 'lucide-react';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Real request: Frontend -> Axios -> POST /api/auth/forgot-password ->
      // Express route -> authController.forgotPassword -> MongoDB lookup ->
      // token generation -> Nodemailer/SMTP. Success is only ever shown
      // below based on this response actually resolving with 2xx.
      const data = await authService.forgotPassword(email);
      toast.success(data.message || 'If that email is registered, a password reset link has been sent.');
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send the reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>🔑 Forgot Password?</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          Please enter your registered email — we'll send you password reset instructions.
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={34} color="white" strokeWidth={2.5} />
              </div>
            </div>

            <h3 style={{ color: '#1b5e20', fontSize: '1.3rem', fontWeight: 'bold', marginTop: 0, marginBottom: '0.9rem' }}>
              Password Reset Link Sent!
            </h3>

            <p style={{ color: '#555', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
              We've sent a password reset link to<br />
              <strong style={{ color: '#1b5e20' }}>{email}</strong>.
            </p>

            <p style={{ color: '#666', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Please check your inbox (and spam folder) for the email with instructions to reset your password.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: '#e8f5e9', padding: '0.9rem 1rem', borderRadius: '6px', color: '#1b5e20', fontSize: '0.85rem' }}>
              <Mail size={18} color="#1b5e20" />
              {/* Real backend expiry is 1 hour (see server/controllers/authController.js
                  forgotPassword: passwordResetExpires = Date.now() + 60*60*1000).
                  This text intentionally reflects that actual value rather than a
                  different figure, so it never misinforms the user about how long
                  their link is really valid. */}
              <span>The link will expire in 1 hour.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {!submitted && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
            Back to login? <Link to="/login" style={{ color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none' }}>Log In</Link>
          </p>
        )}
      </div>
    </div>
  );
}
