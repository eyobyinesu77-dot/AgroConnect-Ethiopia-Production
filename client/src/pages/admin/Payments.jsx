import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_COLORS = {
  Success: { bg: '#e8f5e9', text: '#2e7d32' },
  Pending: { bg: '#fff8e1', text: '#f57f17' },
  Failed: { bg: '#ffebee', text: '#c62828' },
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await paymentService.getAllPayments();
        if (isMounted) setPayments(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load payments.');
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
    return <LoadingSpinner fullScreen={false} label="Loading payments..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>💳 Payments Management</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Monitor payment activity across the platform.</p>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem', marginBottom: '1.5rem', display: 'inline-block' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Total Confirmed Revenue</p>
        <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold', color: '#1b5e20' }}>
          {totalRevenue.toLocaleString()} ETB
        </p>
      </div>

      {payments.length === 0 ? (
        <p style={{ color: '#666' }}>No payments have been recorded yet.</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Buyer</th>
                <th style={{ padding: '0.75rem 1rem' }}>Order</th>
                <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const colors = STATUS_COLORS[payment.status] || STATUS_COLORS.Pending;
                return (
                  <tr key={payment._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{payment.user?.fullName || 'Unknown'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>#{payment.order?._id?.slice(-6).toUpperCase()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{payment.paymentMethod}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{payment.amount.toLocaleString()} ETB</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: colors.bg, color: colors.text, fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#888' }}>
                      {new Date(payment.createdAt).toLocaleDateString()}
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
