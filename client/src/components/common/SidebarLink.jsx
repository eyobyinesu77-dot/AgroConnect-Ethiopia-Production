import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SidebarLink({ to, icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-green-700 text-white' : 'text-[#166534] hover:bg-green-100'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
