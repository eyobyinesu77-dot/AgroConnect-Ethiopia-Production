import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../../components/common/DashboardCard';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';

const QUICK_ACTIONS = [
  { label: 'Browse Products', to: '/buyer/marketplace', icon: '🛍️' },
  { label: 'Cart', to: '/buyer/cart', icon: '🛒' },
  { label: 'Checkout', to: '/buyer/checkout', icon: '💳' },
  { label: 'View Orders', to: '/buyer/orders', icon: '📦' },
  { label: 'Wishlist', to: '/buyer/wishlist', icon: '❤️' },
];

export default function BuyerDashboard() {
  const { totalItems } = useCart();
  const [orderStats, setOrderStats] = useState({ active: 0, completed: 0 });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const orders = await orderService.getMyOrders();
        if (!isMounted) return;
        const active = orders.filter((o) => ['Pending', 'Confirmed'].includes(o.status)).length;
        const completed = orders.filter((o) => o.status === 'Completed').length;
        setOrderStats({ active, completed });
      } catch {
        // Dashboard stats are non-critical — fail silently and keep zeros.
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>🛒 Buyer Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Buy products and track your orders.</p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link to="/buyer/orders" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title="Active Orders" value={String(orderStats.active)} color="#1976d2" icon="📦" />
        </Link>
        <Link to="/buyer/cart" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title="Cart Items" value={String(totalItems)} color="#f57c00" icon="🛒" />
        </Link>
        <Link to="/buyer/orders" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title="Completed Purchases" value={String(orderStats.completed)} color="#2e7d32" icon="✅" />
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
