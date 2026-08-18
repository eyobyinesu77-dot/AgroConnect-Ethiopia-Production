import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import OrderCard from '../../components/common/OrderCard';
import { orderService } from '../../services/orderService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

const NEXT_STATUS = {
  Pending: 'Confirmed',
  Confirmed: 'Completed',
};

// A Telebirr order needs the farmer to review the buyer's screenshot before
// it can be dispatched — mirrors the guard the backend enforces in
// updateOrderStatus, so the UI never offers an action the API will reject.
const needsPaymentVerification = (order) =>
  order.paymentMethod === 'Telebirr' &&
  order.paymentStatus !== 'Paid' &&
  order.payment?.proofOfPayment?.url &&
  order.payment?.status === 'Pending';

export default function FarmerOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const loadOrders = async () => {
    try {
      const data = await orderService.getFarmerOrders();
      setOrders(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAdvance = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setUpdatingId(order._id);
    try {
      await orderService.updateOrderStatus(order._id, nextStatus);
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: nextStatus } : o)));
      toast.success(`Order marked as ${nextStatus}.`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerify = async (order, verified) => {
    if (!order.payment?._id) return;

    setVerifyingId(order._id);
    try {
      await orderService.verifyPayment(order._id, order.payment._id, verified);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? {
                ...o,
                paymentStatus: verified ? 'Paid' : o.paymentStatus,
                payment: { ...o.payment, status: verified ? 'Success' : 'Failed' },
              }
            : o
        )
      );
      toast.success(verified ? '✅ Payment verified.' : '❌ Payment proof rejected.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payment verification.');
    } finally {
      setVerifyingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('orders_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('orders_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('orders_subtitle')}</p>

      {orders.length === 0 ? (
        <p style={{ color: '#666' }}>{t('orders_empty')}</p>
      ) : (
        orders.map((order) => {
          const pendingVerification = needsPaymentVerification(order);
          const blockedByPayment = order.status === 'Pending' && pendingVerification;

          return (
            <OrderCard
              key={order._id}
              order={order}
              subtitle={`${t('orders_buyer_label')}: ${order.buyer?.fullName || 'Unknown'} (${order.buyer?.phone || 'no phone'})`}
              total={order.myTotal}
              paymentProofUrl={order.payment?.proofOfPayment?.url}
              transactionId={order.payment?.transactionId}
              verifyActions={
                pendingVerification ? (
                  <>
                    <button
                      onClick={() => handleVerify(order, true)}
                      disabled={verifyingId === order._id}
                      style={{
                        backgroundColor: '#2e7d32',
                        color: 'white',
                        border: 'none',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: verifyingId === order._id ? 'not-allowed' : 'pointer',
                        opacity: verifyingId === order._id ? 0.7 : 1,
                      }}
                    >
                      {verifyingId === order._id ? t('orders_confirm_payment_saving') : t('orders_confirm_payment_button')}
                    </button>
                    <button
                      onClick={() => handleVerify(order, false)}
                      disabled={verifyingId === order._id}
                      style={{
                        backgroundColor: 'white',
                        color: '#c62828',
                        border: '1px solid #c62828',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: verifyingId === order._id ? 'not-allowed' : 'pointer',
                        opacity: verifyingId === order._id ? 0.7 : 1,
                      }}
                    >
                      {t('orders_reject_screenshot_button')}
                    </button>
                  </>
                ) : order.payment?.status === 'Failed' ? (
                  <span style={{ fontSize: '0.85rem', color: '#c62828', fontWeight: 'bold' }}>
                    {t('orders_screenshot_rejected_note')}
                  </span>
                ) : order.payment?.status === 'Success' ? (
                  <span style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 'bold' }}>
                    {t('orders_payment_verified_note')}
                  </span>
                ) : null
              }
              actions={
                blockedByPayment ? (
                  <span style={{ fontSize: '0.82rem', color: '#e65100', fontStyle: 'italic' }}>
                    {t('orders_verify_before_dispatch')}
                  </span>
                ) : NEXT_STATUS[order.status] ? (
                  <button
                    onClick={() => handleAdvance(order)}
                    disabled={updatingId === order._id}
                    style={{
                      backgroundColor: '#2e7d32',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      cursor: updatingId === order._id ? 'not-allowed' : 'pointer',
                      opacity: updatingId === order._id ? 0.7 : 1,
                    }}
                  >
                    {updatingId === order._id ? t('orders_updating') : `${t('orders_mark_as')} ${NEXT_STATUS[order.status]}`}
                  </button>
                ) : null
              }
            />
          );
        })
      )}
    </div>
  );
}
