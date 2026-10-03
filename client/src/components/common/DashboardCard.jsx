import React from 'react';

export default function DashboardCard({ title, value, color = '#2e7d32', icon }) {
  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '1.5rem', 
      borderRadius: '8px', 
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)', 
      borderLeft: `5px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      flex: '1',
      minWidth: '200px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>{title}</span>
        {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
      </div>
      <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#333' }}>{value}</h3>
    </div>
  );
}