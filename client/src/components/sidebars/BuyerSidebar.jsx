import React from 'react';
import SidebarLink from '../common/SidebarLink';

export default function BuyerSidebar() {
  const links = [
    { to: '/buyer/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/buyer/marketplace', label: 'Marketplace', icon: '🛍️' },
    { to: '/buyer/cart', label: 'Cart', icon: '🛒' },
    { to: '/buyer/orders', label: 'Orders', icon: '🧾' },
    { to: '/buyer/wishlist', label: 'Wishlist', icon: '❤️' },
    { to: '/buyer/messages', label: 'Messages', icon: '💬' },
    { to: '/buyer/profile', label: 'Profile', icon: '👤' },
    { to: '/buyer/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
