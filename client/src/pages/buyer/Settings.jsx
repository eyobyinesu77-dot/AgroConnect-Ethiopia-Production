import React from 'react';
import PasswordSettingsForm from '../../components/common/PasswordSettingsForm';

export default function BuyerSettings() {
  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1.5rem' }}>⚙️ Settings</h2>
      <PasswordSettingsForm />
    </div>
  );
}
