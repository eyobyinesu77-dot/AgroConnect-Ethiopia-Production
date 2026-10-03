import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { paymentMethods } from '../../utils/constants';

const STATUS_LABEL_KEYS = {
  Pending: 'order_status_pending',
  Confirmed: 'order_status_confirmed',
  Completed: 'order_status_completed',
  Cancelled: 'order_status_cancelled',
};

const STATUS_COLORS = {
  Pending: { bg: '#fff8e1', text: '#f57f17' },
  Confirmed: { bg: '#e3f2fd', text: '#1565c0' },
  Completed: { bg: '#e8f5e9', text: '#2e7d32' },
  Cancelled: { bg: '#ffebee', text: '#c62828' },
};

export default function OrderCard({ order, subtitle, total, actions, paymentProofUrl, transactionId, verifyActions }) {
  const { t, formatNumber, formatDate } = useLanguage();
  const colors = STATUS_COLORS[order.status] || STATUS_COLORS.Pending;

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
          <h4 style={{ margin: '0 0 0.2rem 0', color: '#333' }}>{t('order_number').replace('{id}', order._id?.slice(-6).toUpperCase())}</h4>
          {subtitle && <p style={{ margin: 0, fontSize: '0.85rem', color: '#777' }}>{subtitle}</p>}
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
            {order.createdAt ? formatDate(order.createdAt) : ''}
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
          {STATUS_LABEL_KEYS[order.status] ? t(STATUS_LABEL_KEYS[order.status]) : order.status}
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
            {order.paymentStatus === 'Paid' ? t('order_paid') : t('order_unpaid')}
            {/* Only the supported methods are shown; an older order saved with a retired
                method just shows Paid/Unpaid until the buyer pays via Chapa or Telebirr. */}
            {paymentMethods.includes(order.paymentMethod) ? ` · ${order.paymentMethod}` : ''}
          </span>
        </div>
      )}

      {/* Telebirr payment screenshot — only present when a buyer has
          uploaded proof of payment for this order. */}
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
          <a href={paymentProofUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={paymentProofUrl}
              alt={t('alt_telebirr_proof')}
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
            <span>{item.product?.name || t('order_product_fallback')} × {item.quantity}</span>
            <span>{formatNumber(item.price * item.quantity)} {t('unit_etb')}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#1b5e20' }}>
          {t('order_total_label').replace('{amount}', formatNumber(total ?? order.totalPrice ?? 0))}
        </span>
        {actions}
      </div>
    </div>
  );
}
