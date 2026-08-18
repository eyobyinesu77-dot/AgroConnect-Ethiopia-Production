import React from 'react';
import SidebarLink from '../common/SidebarLink';

export default function ExtensionSidebar() {
  const links = [
    { to: '/extension/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/extension/farmers', label: 'Farmers', icon: '👨‍🌾' },
    { to: '/extension/visits', label: 'Visits', icon: '🚜' },
    { to: '/extension/advice', label: 'Advice', icon: '💡' },
    { to: '/extension/crop-conditions', label: 'Crop Conditions', icon: '🌾' },
    { to: '/extension/weather', label: 'Weather', icon: '🌦️' },
    { to: '/extension/trainings', label: 'Trainings', icon: '🎓' },
    { to: '/extension/reports', label: 'Reports', icon: '📊' },
    { to: '/extension/messages', label: 'Messages', icon: '💬' },
    { to: '/extension/profile', label: 'Profile', icon: '👤' },
    { to: '/extension/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {links.map((l) => (
        <SidebarLink key={l.to} {...l} />
      ))}
    </>
  );
}
