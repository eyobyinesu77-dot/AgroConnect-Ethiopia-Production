import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey } from '../../utils/i18nKeys';
const STATUS_COLORS = {
  Success: { bg: '#e8f5e9', text: '#2e7d32' },
  Pending: { bg: '#fff8e1', text: '#f57f17' },
  Failed: { bg: '#ffebee', text: '#c62828' },
};

export default function AdminPayments() {
  const { t, formatNumber, formatDate } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await paymentService.getAllPayments();
        if (isMounted) setPayments(data);
      } catch (error) {
        toast.error(t(apiErrorKey(error, 'admin_payments_load_error', 'admin_payments_load_error')));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const totalRevenue = payments
    .filter((p) => p.status === 'Success')
    .reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('admin_payments_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('admin_payments_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('admin_payments_subtitle')}</p>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem', marginBottom: '1.5rem', display: 'inline-block' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{t('admin_payments_total_revenue')}</p>
        <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold', color: '#1b5e20' }}>
          {formatNumber(totalRevenue)} {t('unit_etb')}
        </p>
      </div>

      {payments.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_payments_empty')}</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_buyer')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_order')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_method')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_amount')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_status')}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t('col_date')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const colors = STATUS_COLORS[payment.status] || STATUS_COLORS.Pending;
                return (
                  <tr key={payment._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{payment.user?.fullName || t('admin_orders_unknown')}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>#{payment.order?._id?.slice(-6).toUpperCase()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{payment.paymentMethod}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{formatNumber(payment.amount)} {t('unit_etb')}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: colors.bg, color: colors.text, fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {t(`payment_status_${payment.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#888' }}>
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
