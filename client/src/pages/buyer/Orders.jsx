import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import OrderCard from '../../components/common/OrderCard';
import TelebirrProofUpload from '../../components/buyer/TelebirrProofUpload';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { paymentMethods } from '../../utils/constants';

import { apiErrorKey } from '../../utils/i18nKeys';
export default function BuyerOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingOrderId, setRetryingOrderId] = useState(null);
  const [retryMethod, setRetryMethod] = useState(paymentMethods[0]);
  const [isPaying, setIsPaying] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'buyer_orders_load_error', 'buyer_orders_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openRetry = (orderId) => {
    setRetryingOrderId(orderId);
    setRetryMethod(paymentMethods[0]);
  };

  const handleRetryPayment = async (orderId) => {
    setIsPaying(true);
    try {
      const result = await paymentService.initializePayment({
        orderId,
        paymentMethod: retryMethod,
      });

      if (result.checkoutUrl) {
        // A real Chapa key is configured — hand the buyer off to Chapa's checkout page.
        window.location.href = result.checkoutUrl;
        return;
      }

      toast.success(result.message || t('buyer_payment_updated'));
      setRetryingOrderId(null);
      loadOrders();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'buyer_payment_failed', 'buyer_payment_failed')));
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('buyer_orders_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1rem' }}>{t('buyer_orders_title')}</h2>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          <p>{t('buyer_orders_empty')}</p>
          <Link to="/marketplace" style={{ color: '#1b5e20', fontWeight: 'bold' }}>{t('buyer_browse_marketplace')}</Link>
        </div>
      ) : (
        orders.map((order) => {
          const canRetry = order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled';
          const isRetrying = retryingOrderId === order._id;

          const isTelebirr = order.paymentMethod === 'Telebirr';
          const proofUrl = order.payment?.proofOfPayment?.url;
          const paymentState = order.payment?.status; // 'Pending' | 'Success' | 'Failed'
          const needsUpload = isTelebirr && (!proofUrl || paymentState === 'Failed');

          return (
            <div key={order._id}>
              <OrderCard
                order={order}
                actions={
                  canRetry ? (
                    isRetrying ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <select
                          value={retryMethod}
                          onChange={(e) => setRetryMethod(e.target.value)}
                          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          {paymentMethods.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRetryPayment(order._id)}
                          disabled={isPaying}
                          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '4px', fontWeight: 'bold', cursor: isPaying ? 'not-allowed' : 'pointer' }}
                        >
                          {isPaying ? t('buyer_processing') : t('buyer_confirm')}
                        </button>
                        <button
                          onClick={() => setRetryingOrderId(null)}
                          disabled={isPaying}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                          {t('buyer_cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openRetry(order._id)}
                        style={{ backgroundColor: '#f57c00', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {t('buyer_retry_payment')}
                      </button>
                    )
                  ) : null
                }
              />

              {/* Telebirr proof-of-payment: upload form, or current status */}
              {isTelebirr && order.payment?._id && (
                needsUpload ? (
                  <>
                    {paymentState === 'Failed' && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#c62828', fontWeight: 'bold' }}>
                        {t('buyer_screenshot_rejected')}
                      </p>
                    )}
                    <TelebirrProofUpload paymentId={order.payment._id} onUploaded={loadOrders} />
                  </>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    {paymentState === 'Success' || order.paymentStatus === 'Paid' ? (
                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{t('buyer_payment_verified')}</span>
                    ) : (
                      <span style={{ color: '#e65100', fontWeight: 'bold' }}>{t('buyer_awaiting_verification')}</span>
                    )}
                  </div>
                )
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
