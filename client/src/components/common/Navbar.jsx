import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LogoImage from '../LogoImage';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'Marketplace', path: '/marketplace' },
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
            {/* Mobile hamburger — LEFT */}
            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              className="md:hidden p-1.5 rounded-md text-[#166534] hover:bg-[#dcfce7] transition-colors shrink-0"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Logo — left */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0"
              onClick={() => setIsMenuOpen(false)}
            >
              <LogoImage size={36} />
              <span className="text-lg font-bold text-[#166534] whitespace-nowrap">AgroConnect</span>
            </Link>

            {/* Nav links — centered row, large screens only */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-[#15803d] bg-[#dcfce7]'
                      : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Login / Register — far right, large screens only */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/login')
                    ? 'text-[#15803d] bg-[#dcfce7]'
                    : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#15803d] hover:bg-[#166534] shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>


          </div>
        </div>

        {/* Mobile & tablet dropdown menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-green-100 bg-[#f9fafb] px-4 pb-4 pt-2">
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-[#15803d] bg-[#dcfce7]'
                      : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-green-100">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium text-center transition-colors ${
                    isActive('/login')
                      ? 'text-[#15803d] bg-[#dcfce7]'
                      : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-[#15803d] hover:bg-[#166534] text-center shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  }

  // Authenticated dashboard bar
  return (
    <nav
      className="md:hidden"
      style={{
        padding: '0.75rem 1.5rem',
        background: '#f9fafb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #bbf7d0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {dashboardPath && (
        <Link to={dashboardPath} style={{ textDecoration: 'none', color: '#166534', fontWeight: 'bold', fontSize: '1rem' }}>
          🌱 AgroConnect
        </Link>
      )}

      <button
        onClick={logout}
        style={{
          padding: '0.3rem 0.8rem',
          cursor: 'pointer',
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}
      >
        🚪 Logout
      </button>
    </nav>
  );
}
