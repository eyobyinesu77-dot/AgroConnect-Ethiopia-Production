import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey } from '../../utils/i18nKeys';
export default function AdminNotifications() {
  const { t, formatNumber, formatDate } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_notif_load_error', 'admin_notif_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_notif_update_error', 'admin_notif_update_error')));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success(t('admin_notif_all_read_toast'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_notif_update_all_error', 'admin_notif_update_all_error')));
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('admin_notif_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ color: '#1b5e20', margin: 0 }}>{t('admin_notif_title')}</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            {t('admin_notif_mark_all_read')}
          </button>
        )}
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('admin_notif_subtitle')}</p>

      {notifications.length === 0 ? (
        <p style={{ color: '#666' }}>{t('admin_notif_empty')}</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => !n.isRead && handleMarkRead(n._id)}
            style={{
              backgroundColor: n.isRead ? 'white' : '#f1f8f2',
              borderLeft: `4px solid ${n.isRead ? '#ddd' : '#2e7d32'}`,
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              padding: '1rem',
              marginBottom: '0.6rem',
              cursor: n.isRead ? 'default' : 'pointer',
            }}
          >
            <p style={{ margin: 0, color: '#333', fontWeight: n.isRead ? 'normal' : 'bold' }}>{n.message}</p>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
              {formatDate(n.createdAt, undefined, true)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
