import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' }}>
      <div style={{ width: '100%', maxWidth: '450px', padding: '1rem' }}>
        <Outlet />
      </div>
    </div>
  );
}