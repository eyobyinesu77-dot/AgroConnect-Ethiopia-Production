import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LogoImage from '../LogoImage';
import { useLanguage } from '../../context/LanguageContext';

const navLinks = [
  { labelKey: 'pubnav_home', path: '/' },
  { labelKey: 'pubnav_about', path: '/about' },
  { labelKey: 'pubnav_contact', path: '/contact' },
  { labelKey: 'pubnav_marketplace', path: '/marketplace' },
];

// Renders two different navbars depending on context:
// - Public pages: the full horizontal link row (logo far left, links across
//   the top on large screens, Login/Register far right, and a toggle menu
//   on mobile/tablet).
// - Authenticated dashboard pages: a compact bar with a hamburger button
//   (mobile/tablet only — desktop's sidebar is always visible so it needs
//   no toggle) and Logout. The actual role-based nav links live in
//   Sidebar.jsx / components/sidebars/*.jsx ONLY — this navbar must not
//   duplicate them, since a second, separately-maintained copy of the same
//   nav list is exactly how it silently went stale before (missing every
//   page added after the list was first written, on mobile/tablet where
//   the real Sidebar drawer couldn't be opened at all without this button).
export default function Navbar({ onMenuClick, dashboardPath }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isMarketplace = location.pathname === '/marketplace';
  const isPublicPage = ['/', '/about', '/contact', '/login', '/register'].includes(location.pathname) || isMarketplace;
  const isActive = (path) => location.pathname === path;

  if (isPublicPage || !user) {
    return (
      <nav className="sticky top-0 z-30 w-full bg-[#f9fafb]/95 backdrop-blur-sm border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo — far left */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0"
              onClick={() => setIsMenuOpen(false)}
            >
              <LogoImage size={36} />
              <span className="text-lg font-bold text-[#166534] whitespace-nowrap">AgroConnect</span>
            </Link>

            {/* Nav links — centered row, large screens only */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-[#166534] bg-green-100'
                      : 'text-gray-600 hover:text-[#166534] hover:bg-green-50'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>

            {/* Login / Register — far right, large screens only */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                to="/login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/login')
                    ? 'text-[#166534] bg-green-100'
                    : 'text-gray-600 hover:text-[#166534] hover:bg-green-50'
                }`}
              >
                {t('pubnav_login')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
              >
                {t('pubnav_register')}
              </Link>
            </div>

            {/* Toggle button — mobile & tablet only */}
            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? t('a11y_close_menu') : t('a11y_open_menu')}
              aria-expanded={isMenuOpen}
              className="lg:hidden p-2 rounded-md text-[#166534] hover:bg-green-50 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile & tablet dropdown menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-green-100 bg-[#f9fafb] px-4 pb-4 pt-2">
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-[#166534] bg-green-100'
                      : 'text-gray-600 hover:text-[#166534] hover:bg-green-50'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-green-100">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium text-center transition-colors ${
                    isActive('/login')
                      ? 'text-[#166534] bg-green-100'
                      : 'text-gray-600 hover:text-[#166534] hover:bg-green-50'
                  }`}
                >
                  {t('pubnav_login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 text-center shadow-sm transition-colors"
                >
                  {t('pubnav_register')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // Authenticated dashboard bar (mobile/tablet) — same dark green as the sidebar
  return (
    <nav className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#14532d] text-white shadow-md">
      <button
        onClick={onMenuClick}
        aria-label={t('nav_open_menu')}
        className="p-1 rounded-md text-white hover:bg-white/15 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {dashboardPath && (
        <Link to={dashboardPath} className="flex items-center gap-2 font-bold text-base text-white no-underline">
          <LogoImage size={28} />
          AgroConnect
        </Link>
      )}

      <button
        onClick={logout}
        className="px-3 py-1.5 rounded-md text-sm font-medium bg-white/15 hover:bg-white/25 text-white transition-colors"
      >
        {t('nav_logout')}
      </button>
    </nav>
  );
}
