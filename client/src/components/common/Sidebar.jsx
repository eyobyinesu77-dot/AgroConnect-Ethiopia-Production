import React from 'react';
import { X, LogOut } from 'lucide-react';
import AdminSidebar from '../sidebars/AdminSidebar';
import FarmerSidebar from '../sidebars/FarmerSidebar';
import BuyerSidebar from '../sidebars/BuyerSidebar';
import ExtensionSidebar from '../sidebars/ExtensionSidebar';
import LogoImage from '../LogoImage';
import { useLanguage } from '../../context/LanguageContext';

const SIDEBAR_BY_ROLE = {
  admin: AdminSidebar,
  farmer: FarmerSidebar,
  buyer: BuyerSidebar,
  extension: ExtensionSidebar,
};

// One shared shell for all four role dashboards (admin / farmer / buyer /
// extension). The dark-to-bright green gradient, white text and green
// active pill are defined HERE and in SidebarLink / LanguageSwitcher only,
// so every role picks up the same look automatically.
export default function Sidebar({ role, onLogout, isOpen, onClose }) {
  const { t } = useLanguage();
  const RoleSidebar = SIDEBAR_BY_ROLE[role];

  return (
    <>
      {/* Backdrop — mobile/tablet only. Always mounted so the opacity change
          can transition; pointer-events-none while hidden so it never blocks
          clicks on the page underneath. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          fixed inset-0 z-40 bg-black/50 lg:hidden
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      <aside
        aria-label={t('a11y_sidebar')}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 shrink-0 text-white
          bg-gradient-to-b from-[#14532d] via-[#15803d] to-[#22a24f]
          flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto lg:h-screen lg:sticky lg:top-0
        `}
      >
        {/* Brand header (all sizes) + close button (mobile/tablet only) */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <LogoImage size={34} />
            <span className="font-bold text-xl text-white tracking-tight">AgroConnect</span>
          </div>
          <button
            onClick={onClose}
            aria-label={t('a11y_close_menu')}
            className="lg:hidden p-1.5 rounded-md text-white/90 hover:bg-white/15 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clicking any nav link (from any role-sidebar) bubbles up here and
            closes the mobile drawer. */}
        <nav aria-label={t('a11y_main_navigation')} onClick={onClose} className="flex-1 flex flex-col gap-1 px-3 pt-2 pb-4">
          {RoleSidebar ? <RoleSidebar /> : null}
        </nav>

        <div className="px-3 py-4 border-t border-white/15">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span>{t('nav_logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
