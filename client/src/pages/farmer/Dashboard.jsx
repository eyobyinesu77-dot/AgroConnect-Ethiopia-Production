import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '../../components/common/DashboardCard';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { loanService } from '../../services/loanService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { tOr } from '../../utils/i18nKeys';

function maskFayidaId(id) {
  if (!id || typeof id !== 'string') return '';
  const digits = id.trim();
  if (digits.length <= 4) return '•'.repeat(digits.length);
  return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export default function FarmerDashboard() {
  const { t, formatNumber } = useLanguage();
  const { user, updateUser } = useAuth();
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loanStatus, setLoanStatus] = useState('None');

  // Prefer live profile API values; fall back to auth context from login.
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [fayidaId, setFayidaId] = useState(user?.fayidaId || '');
  const [showFayida, setShowFayida] = useState(false);

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

    // Load authenticated farmer profile from API (own record only via JWT protect).
    (async () => {
      try {
        const profile = await userService.getProfile();
        if (!isMounted || !profile) return;

        const name = profile.fullName || '';
        const id = profile.fayidaId || '';
        setFullName(name);
        setFayidaId(id);

        // Keep auth context / localStorage in sync for refresh and other pages.
        updateUser({
          fullName: name,
          name: name,
          fayidaId: id,
          region: profile.region,
          zone: profile.zone,
          woreda: profile.woreda,
          kebele: profile.kebele,
          email: profile.email,
          phone: profile.phone,
        });
      } catch {
        if (isMounted) {
          setFullName(user?.fullName || user?.name || '');
          setFayidaId(user?.fayidaId || '');
        }
      }
    })();

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
        // non-critical
      }
    })();

    (async () => {
      try {
        const loans = await loanService.getMyLoans();
        if (!isMounted || loans.length === 0) return;
        const mostRecent = [...loans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setLoanStatus(mostRecent.status);
      } catch {
        // keep default
      }
    })();

    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greetingName = fullName?.trim() || null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.35rem' }}>
        {greetingName
          ? (t('dashboard_welcome_name') || 'Welcome, {name}').replace('{name}', greetingName)
          : (t('dashboard_title') || 'Farmer Dashboard')}
      </h2>
      {greetingName && (
        <p style={{ color: '#2e7d32', fontWeight: 600, fontSize: '1.05rem', margin: '0 0 0.35rem 0' }}>
          {greetingName}
        </p>
      )}
      <p style={{ color: '#666', marginBottom: '1rem' }}>{t('dashboard_subtitle')}</p>

      {/* Own Full Name + Fayida ID from profile API */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #e8f5e9',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 1rem' }}>
          <span style={{ fontWeight: 600, color: '#1b5e20', fontSize: '0.9rem', minWidth: '5.5rem' }}>
            {t('profile_full_name') || 'Full Name'}
          </span>
          {fullName ? (
            <span style={{ fontSize: '1rem', color: '#222', fontWeight: 600 }}>{fullName}</span>
          ) : (
            <span style={{ color: '#888', fontSize: '0.9rem' }}>
              {t('dashboard_name_missing') || 'Not set — add your name in Profile.'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.75rem' }}>
          <span style={{ fontWeight: 600, color: '#1b5e20', fontSize: '0.9rem', minWidth: '5.5rem' }}>
            {t('dashboard_fayida_label') || 'Fayida ID'}
          </span>
          {fayidaId ? (
            <>
              <code
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.95rem',
                  letterSpacing: '0.04em',
                  color: '#333',
                  backgroundColor: '#f5f5f5',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                }}
              >
                {showFayida ? fayidaId : maskFayidaId(fayidaId)}
              </code>
              <button
                type="button"
                onClick={() => setShowFayida((v) => !v)}
                style={{
                  border: '1px solid #c8e6c9',
                  backgroundColor: '#f1f8f2',
                  color: '#1b5e20',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.3rem 0.7rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                {showFayida
                  ? (t('dashboard_fayida_hide') || 'Hide')
                  : (t('dashboard_fayida_show') || 'Show')}
              </button>
            </>
          ) : (
            <span style={{ color: '#888', fontSize: '0.9rem' }}>
              {t('dashboard_fayida_missing') || 'Not set — complete your profile to add it.'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link to="/farmer/products" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('dashboard_card_my_products')} value={formatNumber(productCount)} color="#2e7d32" icon="🌾" />
        </Link>
        <Link to="/farmer/orders" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('dashboard_card_orders_fulfilled')} value={formatNumber(orderCount)} color="#1976d2" icon="📦" />
        </Link>
        <Link to="/farmer/loans" style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}>
          <DashboardCard title={t('dashboard_card_loan_status')} value={tOr(t, `loan_status_${String(loanStatus).toLowerCase()}`, loanStatus)} color="#f57c00" icon="💰" />
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
