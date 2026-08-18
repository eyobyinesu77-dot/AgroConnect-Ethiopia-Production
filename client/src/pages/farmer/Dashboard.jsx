import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../../components/common/DashboardCard';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { loanService } from '../../services/loanService';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerDashboard() {
  const { t } = useLanguage();
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loanStatus, setLoanStatus] = useState('None');

  const QUICK_ACTIONS = [
    { label: t('quick_action_add_product'), to: '/farmer/sell-crop', icon: '➕' },
    { label: t('quick_action_my_products'), to: '/farmer/products', icon: '🌾' },
    { label: t('quick_action_view_orders'), to: '/farmer/orders', icon: '📦' },
    { label: t('quick_action_apply_loan'), to: '/farmer/loans', icon: '💰' },
    { label: t('quick_action_weather'), to: '/farmer/weather', icon: '🌦️' },
    { label: t('quick_action_messages'), to: '/farmer/messages', icon: '💬' },
  ];

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [products, orders] = await Promise.all([
          productService.getMyProducts(),
          orderService.getFarmerOrders(),
        ]);
        if (!isMounted) return;
        setProductCount(products.length);
        setOrderCount(orders.length);
      } catch {
        // Dashboard stats are non-critical — fail silently and keep zeros.
      }
    })();

    // Separate try/catch so a loans-endpoint failure can't blank out the
    // product/order counts above, and vice versa.
    (async () => {
      try {
        const loans = await loanService.getMyLoans();
        if (!isMounted || loans.length === 0) return;
        // Most recent loan's status — matches what the farmer would see
        // first on their own Loans page (sorted newest first there too).
        const mostRecent = [...loans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setLoanStatus(mostRecent.status);
      } catch {
        // Keep the 'None' default.
      }
    })();

    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('dashboard_title')}</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>{t('dashboard_subtitle')}</p>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link to="/farmer/products" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('dashboard_card_my_products')} value={String(productCount)} color="#2e7d32" icon="🌾" />
        </Link>
        <Link to="/farmer/orders" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('dashboard_card_orders_fulfilled')} value={String(orderCount)} color="#1976d2" icon="📦" />
        </Link>
        <Link to="/farmer/loans" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('dashboard_card_loan_status')} value={loanStatus} color="#f57c00" icon="💰" />
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
