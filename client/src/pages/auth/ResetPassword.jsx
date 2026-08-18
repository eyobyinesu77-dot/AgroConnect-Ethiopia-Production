import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Your password has been reset successfully! 🎉');
    navigate('/login');
  };

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
              style={{ width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}