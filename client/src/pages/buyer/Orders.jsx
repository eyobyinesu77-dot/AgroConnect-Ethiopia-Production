import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import OrderCard from '../../components/common/OrderCard';
import TelebirrProofUpload from '../../components/buyer/TelebirrProofUpload';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import { paymentMethods } from '../../utils/constants';

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingOrderId, setRetryingOrderId] = useState(null);
  const [retryMethod, setRetryMethod] = useState('Cash on Delivery');
  const [isPaying, setIsPaying] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load your orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openRetry = (orderId) => {
    setRetryingOrderId(orderId);
    setRetryMethod('Cash on Delivery');
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

      toast.success(result.message || 'Payment updated.');
      setRetryingOrderId(null);
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading your orders..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1rem' }}>📦 My Orders</h2>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          <p>You haven't placed any orders yet.</p>
          <Link to="/marketplace" style={{ color: '#1b5e20', fontWeight: 'bold' }}>Browse the Marketplace</Link>
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
                          {isPaying ? 'Processing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setRetryingOrderId(null)}
                          disabled={isPaying}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openRetry(order._id)}
                        style={{ backgroundColor: '#f57c00', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        💳 Retry Payment
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
                        ❌ The farmer rejected your last screenshot — please re-upload with the correct transaction ID.
                      </p>
                    )}
                    <TelebirrProofUpload paymentId={order.payment._id} onUploaded={loadOrders} />
                  </>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    {paymentState === 'Success' || order.paymentStatus === 'Paid' ? (
                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✅ Payment verified by farmer.</span>
                    ) : (
                      <span style={{ color: '#e65100', fontWeight: 'bold' }}>⏳ Awaiting farmer's payment verification.</span>
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
