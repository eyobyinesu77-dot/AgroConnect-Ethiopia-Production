import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

export default function PasswordSettingsForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword(newPassword);
      toast.success('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '450px' }}
    >
      <h3 style={{ margin: 0, color: '#1b5e20', fontSize: '1.05rem' }}>🔒 Change Password</h3>
      <div>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Confirm New Password</label>
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
        {isSaving ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
}
