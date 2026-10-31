import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import SidebarLink from '../common/SidebarLink';
import { useLanguage } from '../../context/LanguageContext';

export default function TransportProviderSidebar() {
  const { t } = useLanguage();

  return (
    <SidebarLink
      to="/provider/dashboard"
      label={t('nav_dashboard')}
      icon={LayoutDashboard}
    />
  );
}
