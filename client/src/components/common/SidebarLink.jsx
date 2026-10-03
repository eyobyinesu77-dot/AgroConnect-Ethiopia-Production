import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// `icon` can be a lucide-react component (preferred — matches the line-icon
// style of the design) or a plain string/emoji (still supported).
export default function SidebarLink({ to, icon: Icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-[#4caf50] text-white shadow-sm'
          : 'text-white/90 hover:bg-white/10 hover:text-white'
      }`}
    >
      {typeof Icon === 'string' ? (
        <span className="w-[18px] text-center shrink-0">{Icon}</span>
      ) : Icon ? (
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      ) : null}
      <span className="truncate">{label}</span>
    </Link>
  );
}
