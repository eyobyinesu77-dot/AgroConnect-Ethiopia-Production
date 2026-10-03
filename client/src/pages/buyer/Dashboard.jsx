import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../../components/common/DashboardCard';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { useLanguage } from '../../context/LanguageContext';

export default function BuyerDashboard() {
  const { t, formatNumber } = useLanguage();
  const { totalItems } = useCart();
  const [orderStats, setOrderStats] = useState({ active: 0, completed: 0 });

  const QUICK_ACTIONS = [
    { label: t('qa_browse_products'), to: '/buyer/marketplace', icon: '🛍️' },
    { label: t('qa_cart'), to: '/buyer/cart', icon: '🛒' },
    { label: t('qa_checkout'), to: '/buyer/checkout', icon: '💳' },
    { label: t('qa_view_orders'), to: '/buyer/orders', icon: '📦' },
    { label: t('qa_wishlist'), to: '/buyer/wishlist', icon: '❤️' },
  ];

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
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('buyerdash_title')}</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>{t('buyerdash_subtitle')}</p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link to="/buyer/orders" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('buyerdash_card_active_orders')} value={formatNumber(orderStats.active)} color="#1976d2" icon="📦" />
        </Link>
        <Link to="/buyer/cart" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('buyerdash_card_cart_items')} value={formatNumber(totalItems)} color="#f57c00" icon="🛒" />
        </Link>
        <Link to="/buyer/orders" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('buyerdash_card_completed')} value={formatNumber(orderStats.completed)} color="#2e7d32" icon="✅" />
        </Link>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#1b5e20', marginBottom: '1rem' }}>{t('dashboard_quick_actions')}</h3>
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
