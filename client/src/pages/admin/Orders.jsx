import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import OrderCard from '../../components/common/OrderCard';
import { orderService } from '../../services/orderService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey } from '../../utils/i18nKeys';
export default function AdminOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await orderService.getAllOrders();
        if (isMounted) setOrders(data);
      } catch (error) {
        toast.error(t(apiErrorKey(error, 'admin_orders_load_error', 'admin_orders_load_error')));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('admin_orders_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('admin_orders_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('admin_orders_subtitle').replace('{count}', orders.length)}</p>

      {orders.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_orders_empty')}</p>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            subtitle={t('admin_orders_buyer_label').replace('{name}', order.buyer?.fullName || t('admin_orders_unknown')).replace('{email}', order.buyer?.email || '')}
          />
        ))
      )}
    </div>
  );
}
