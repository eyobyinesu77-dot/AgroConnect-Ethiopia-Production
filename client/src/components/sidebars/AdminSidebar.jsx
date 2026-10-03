import React from 'react';
import { Bell, ClipboardList, CreditCard, FileText, FlaskConical, Headphones, Landmark, Layers, LayoutDashboard, MessageSquare, Package, Settings, ShoppingCart, Sprout, Tractor, TrendingUp, Truck, User, Users } from 'lucide-react';
import SidebarLink from '../common/SidebarLink';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminSidebar() {
  const { t } = useLanguage();

  const links = [
    { to: '/admin/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/admin/users', label: t('nav_users'), icon: Users },
    { to: '/admin/farmers', label: t('nav_farmers'), icon: Sprout },
    { to: '/admin/buyers', label: t('nav_buyers'), icon: ShoppingCart },
    { to: '/admin/extension-workers', label: t('nav_extension_workers'), icon: FlaskConical },
    { to: '/admin/products', label: t('nav_products'), icon: Package },
    { to: '/admin/orders', label: t('nav_orders'), icon: ClipboardList },
    { to: '/admin/categories', label: t('nav_categories'), icon: Layers },
    { to: '/admin/loans', label: t('nav_loans'), icon: Landmark },
    { to: '/admin/payments', label: t('nav_payments'), icon: CreditCard },
    { to: '/admin/logistics', label: t('nav_logistics'), icon: Truck },
    { to: '/admin/transport-providers', label: t('nav_transport_providers'), icon: Tractor },
    { to: '/admin/reports', label: t('nav_reports'), icon: FileText },
    { to: '/admin/analytics', label: t('nav_analytics'), icon: TrendingUp },
    { to: '/admin/notifications', label: t('nav_notifications'), icon: Bell },
    { to: '/admin/support', label: t('nav_support'), icon: Headphones },
    { to: '/admin/messages', label: t('nav_messages'), icon: MessageSquare },
    { to: '/admin/settings', label: t('nav_settings'), icon: Settings },
    { to: '/admin/profile', label: t('nav_profile'), icon: User },
  ];

  return (
    <>
      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
