import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_COLORS = {
  Pending: { bg: '#fff8e1', text: '#f57f17' },
  Confirmed: { bg: '#e3f2fd', text: '#1565c0' },
  Completed: { bg: '#e8f5e9', text: '#2e7d32' },
  Cancelled: { bg: '#ffebee', text: '#c62828' },
};

export default function OrderCard({ order, subtitle, total, actions, paymentProofUrl, transactionId, verifyActions }) {
  const { t } = useLanguage();
  const colors = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;

  const fullProofUrl = paymentProofUrl 
    ? (paymentProofUrl.startsWith('http') ? paymentProofUrl : `http://localhost:5000${paymentProofUrl}`)
    : '';

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '1.25rem',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
        borderLeft: `4px solid ${colors.text}`,
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.2rem 0', color: '#333' }}>Order #{order._id?.slice(-6).toUpperCase()}</h4>
          {subtitle && <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>{subtitle}</p>}
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
          </p>
        </div>
        <span
          style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            backgroundColor: colors.bg,
            color: colors.text,
            fontWeight: 'bold',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
          }}
        >
          {order.status}
        </span>
      </div>

      {order.paymentStatus && (
        <div style={{ marginBottom: '0.75rem' }}>
          <span
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 'bold',
              backgroundColor: order.paymentStatus === 'Paid' ? '#e8f5e9' : '#fff3e0',
              color: order.paymentStatus === 'Paid' ? '#2e7d32' : '#e65100',
            }}
          >
            {order.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Unpaid'}
            {order.paymentMethod ? ` · ${order.paymentMethod}` : ''}
          </span>
        </div>
      )}

      {paymentProofUrl && (
        <div
          style={{
            marginBottom: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#fafafa',
            border: '1px solid #eee',
            borderRadius: '6px',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>
            {t('orders_screenshot_label')}
          </p>
          {transactionId && (
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#333' }}>
              {t('orders_transaction_id_label')}:{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: '#eee', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
                {transactionId}
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                {t('orders_transaction_id_hint')}
              </span>
            </p>
          )}
          <a href={fullProofUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={fullProofUrl}
              alt="Telebirr payment proof uploaded by buyer"
              style={{ maxWidth: '280px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', display: 'block' }}
            />
          </a>
          {verifyActions && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {verifyActions}
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {(order.orderItems || []).map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
            <span>{item.product?.name || 'Product'} × {item.quantity}</span>
            <span>{(item.price * item.quantity).toLocaleString()} ETB</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#1b5e20' }}>
          Total: {(total ?? order.totalPrice ?? 0).toLocaleString()} ETB
        </span>
        {actions}
      </div>
    </div>
  );
}

