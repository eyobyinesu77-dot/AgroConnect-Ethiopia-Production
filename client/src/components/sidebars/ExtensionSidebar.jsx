import React from 'react';
import { CloudSun, FileText, GraduationCap, LayoutDashboard, Lightbulb, MessageSquare, Settings, Sprout, Tractor, User, Wheat } from 'lucide-react';
import SidebarLink from '../common/SidebarLink';
import { useLanguage } from '../../context/LanguageContext';

export default function ExtensionSidebar() {
  const { t } = useLanguage();

  const links = [
    { to: '/extension/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/extension/farmers', label: t('nav_farmers'), icon: Sprout },
    { to: '/extension/visits', label: t('nav_visits'), icon: Tractor },
    { to: '/extension/advice', label: t('nav_advice'), icon: Lightbulb },
    { to: '/extension/crop-conditions', label: t('nav_crop_conditions'), icon: Wheat },
    { to: '/extension/weather', label: t('nav_weather'), icon: CloudSun },
    { to: '/extension/trainings', label: t('nav_trainings'), icon: GraduationCap },
    { to: '/extension/reports', label: t('nav_reports'), icon: FileText },
    { to: '/extension/messages', label: t('nav_messages'), icon: MessageSquare },
    { to: '/extension/profile', label: t('nav_profile'), icon: User },
    { to: '/extension/settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <>
      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
