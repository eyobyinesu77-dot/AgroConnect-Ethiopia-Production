// components/LogoImage.jsx
import React from 'react';

export default function LogoImage({ size = 50 }) {
  // This is a simple green circle with a plant icon as base64
  const logoBase64 = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#2e7d32"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="#66bb6a" stroke-width="2"/>
      <line x1="50" y1="65" x2="50" y2="30" stroke="white" stroke-width="3" stroke-linecap="round"/>
      <path d="M50 35 Q40 30 35 38 Q42 35 50 35" fill="#a5d6a7"/>
      <path d="M50 45 Q38 40 32 48 Q40 45 50 45" fill="#81c784"/>
      <path d="M50 35 Q60 30 65 38 Q58 35 50 35" fill="#a5d6a7"/>
      <path d="M50 45 Q62 40 68 48 Q60 45 50 45" fill="#81c784"/>
      <path d="M50 30 Q46 24 42 28 Q47 27 50 30" fill="#c8e6c9"/>
      <path d="M50 30 Q54 24 58 28 Q53 27 50 30" fill="#c8e6c9"/>
      <circle cx="50" cy="28" r="3" fill="#ffeb3b" opacity="0.8"/>
      <path d="M35 68 Q42 65 50 68 Q58 65 65 68" stroke="#81c784" stroke-width="3" fill="none"/>
    </svg>
  `);

  return (
    <img 
      src={logoBase64} 
      alt="AgroConnect Logo" 
      width={size} 
      height={size}
      style={{ 
        borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
      }}
    />
  );
}