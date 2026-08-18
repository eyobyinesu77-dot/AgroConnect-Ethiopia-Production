import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load notifications.');
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
      toast.error(error.response?.data?.message || 'Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All caught up!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notifications.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading notifications..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ color: '#1b5e20', margin: 0 }}>🔔 Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            Mark all as read
          </button>
        )}
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Notifications for activity across the platform.</p>

      {notifications.length === 0 ? (
        <p style={{ color: '#666' }}>No notifications yet.</p>
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
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
