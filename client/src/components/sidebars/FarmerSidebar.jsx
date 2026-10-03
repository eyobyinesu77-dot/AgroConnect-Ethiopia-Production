import React from 'react';
import { ClipboardList, CloudSun, GraduationCap, Landmark, LayoutDashboard, Lightbulb, MessageSquare, Package, PlusCircle, Settings, Tractor, Truck, User, Wheat } from 'lucide-react';
import SidebarLink from '../common/SidebarLink';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerSidebar() {
  const { t } = useLanguage();

  const links = [
    { to: '/farmer/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/farmer/products', label: t('nav_my_products'), icon: Package },
    { to: '/farmer/sell-crop', label: t('nav_sell_crop'), icon: PlusCircle },
    { to: '/farmer/orders', label: t('nav_incoming_orders'), icon: ClipboardList },
    { to: '/farmer/loans', label: t('nav_loans'), icon: Landmark },
    { to: '/farmer/weather', label: t('nav_weather'), icon: CloudSun },
    { to: '/farmer/advice', label: t('nav_advice'), icon: Lightbulb },
    { to: '/farmer/crop-conditions', label: t('nav_crop_conditions'), icon: Wheat },
    { to: '/farmer/trainings', label: t('nav_trainings'), icon: GraduationCap },
    { to: '/farmer/visits', label: t('nav_visits'), icon: Tractor },
    { to: '/farmer/logistics', label: t('nav_logistics'), icon: Truck },
    { to: '/farmer/messages', label: t('nav_messages'), icon: MessageSquare },
    { to: '/farmer/profile', label: t('nav_profile'), icon: User },
    { to: '/farmer/settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <>

      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
