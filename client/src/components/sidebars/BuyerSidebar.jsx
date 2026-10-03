import React from 'react';
import { ClipboardList, Heart, LayoutDashboard, MessageSquare, Settings, ShoppingCart, Store, Truck, User } from 'lucide-react';
import SidebarLink from '../common/SidebarLink';
import { useLanguage } from '../../context/LanguageContext';

export default function BuyerSidebar() {
  const { t } = useLanguage();

  const links = [
    { to: '/buyer/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/buyer/marketplace', label: t('nav_marketplace'), icon: Store },
    { to: '/buyer/cart', label: t('nav_cart'), icon: ShoppingCart },
    { to: '/buyer/orders', label: t('nav_orders'), icon: ClipboardList },
    { to: '/buyer/wishlist', label: t('nav_wishlist'), icon: Heart },
    { to: '/buyer/logistics', label: t('nav_logistics'), icon: Truck },
    { to: '/buyer/messages', label: t('nav_messages'), icon: MessageSquare },
    { to: '/buyer/profile', label: t('nav_profile'), icon: User },
    { to: '/buyer/settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <>
      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
