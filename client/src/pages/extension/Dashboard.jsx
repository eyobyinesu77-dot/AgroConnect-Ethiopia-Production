import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../../components/common/DashboardCard';
import { extensionService } from '../../services/extensionService';
import { adviceService } from '../../services/adviceService';

const QUICK_ACTIONS = [
  { label: 'Schedule Visit', to: '/extension/visits', icon: '🚜' },
  { label: 'Create Advice', to: '/extension/advice', icon: '💡' },
  { label: 'Create Report', to: '/extension/reports', icon: '📊' },
  { label: 'Training', to: '/extension/trainings', icon: '🎓' },
  { label: 'Messages', to: '/extension/messages', icon: '💬' },
  { label: 'Assigned Farmers', to: '/extension/farmers', icon: '👨‍🌾' },
];

export default function ExtensionDashboard() {
  // Real counts fetched from the same endpoints their own pages use — no
  // hardcoded numbers. Each fetch fails independently so one failing
  // endpoint doesn't blank out the other two cards.
  const [stats, setStats] = useState({ farmers: 0, advice: 0, visits: 0 });

  useEffect(() => {
    let isMounted = true;

    extensionService.getFarmersList()
      .then((data) => { if (isMounted) setStats((prev) => ({ ...prev, farmers: data.length })); })
      .catch(() => {});

    adviceService.getMyAdvice()
      .then((data) => { if (isMounted) setStats((prev) => ({ ...prev, advice: data.length })); })
      .catch(() => {});

    extensionService.getMyVisits()
      .then((data) => { if (isMounted) setStats((prev) => ({ ...prev, visits: data.length })); })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>👩‍🔬 Extension Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Coordinate farmer support and day-to-day monitoring.</p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link to="/extension/farmers" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title="Farmers Supervised" value={String(stats.farmers)} color="#2e7d32" icon="👨‍🌾" />
        </Link>
        <Link to="/extension/advice" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title="Advice Given" value={String(stats.advice)} color="#1976d2" icon="💡" />
        </Link>
        <Link to="/extension/visits" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title="Farm Visits" value={String(stats.visits)} color="#f57c00" icon="🚜" />
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#1b5e20', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              style={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                borderRadius: '10px',
                backgroundColor: '#f1f8f2',
                color: '#1b5e20',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
