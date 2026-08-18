import React from 'react';
import ProfileForm from '../../components/common/ProfileForm';

export default function ExtensionProfile() {
  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1.5rem' }}>👤 My Profile</h2>
      <ProfileForm />
    </div>
  );
}
