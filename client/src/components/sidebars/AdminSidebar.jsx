import React from 'react';
import SidebarLink from '../common/SidebarLink';

export default function AdminSidebar() {
  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/farmers', label: 'Farmers', icon: '👨‍🌾' },
    { to: '/admin/buyers', label: 'Buyers', icon: '🛒' },
    { to: '/admin/extension-workers', label: 'Extension Workers', icon: '👩‍🔬' },
    { to: '/admin/products', label: 'Products', icon: '📦' },
    { to: '/admin/orders', label: 'Orders', icon: '🧾' },
    { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
    { to: '/admin/loans', label: 'Loans', icon: '💰' },
    { to: '/admin/payments', label: 'Payments', icon: '💳' },
    { to: '/admin/reports', label: 'Reports', icon: '📊' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { to: '/admin/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/admin/support', label: 'Support Tickets', icon: '🎧' },
    { to: '/admin/messages', label: 'Messages', icon: '💬' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
    { to: '/admin/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <>
      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
