import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import OrderCard from '../../components/common/OrderCard';
import { orderService } from '../../services/orderService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await orderService.getAllOrders();
        if (isMounted) setOrders(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load orders.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading orders..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>🧾 All Orders</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{orders.length} orders placed on the platform.</p>

      {orders.length === 0 ? (
        <p style={{ color: '#666' }}>No orders placed yet.</p>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            subtitle={`Buyer: ${order.buyer?.fullName || 'Unknown'} (${order.buyer?.email || ''})`}
          />
        ))
      )}
    </div>
  );
}
