import React from 'react';
import { Link } from 'react-router-dom';

export default function VerifyEmail() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: '#f4f6f8', padding: '2rem 0' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
        <h2 style={{ color: '#1b5e20', marginTop: 0, marginBottom: '1rem' }}>Verify Your Email</h2>
        <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
          A verification email has been sent to your address. Please open it and click the link to activate your account.
        </p>
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