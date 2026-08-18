import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../hooks/useAuth';

/**
 * DashboardLayout Component
 * 
 * Manages the main dashboard layout for authenticated users.
 * - Extracts user role and generates dynamic dashboardPath
 * - Manages mobile sidebar state with auto-close on route changes
 * - Prevents body scroll when sidebar is open
 * - Handles keyboard escape to close sidebar
 */
export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Generate dynamic dashboard path based on user role
  const dashboardPath = user?.role ? {
    farmer: '/farmer/dashboard',
    buyer: '/buyer/dashboard',
    extension: '/extension/dashboard',
    admin: '/admin/dashboard',
  }[user.role] : null;

  /**
   * Close sidebar automatically on route changes.
   * On mobile, keeping the sidebar open after clicking a link would cover the new page.
   */
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  /**
   * Handle mobile sidebar behavior:
   * - Prevent body scroll when sidebar is open (prevent underlying page from scrolling)
   * - Listen for Escape key to close the sidebar
   * - Cleanup: restore body scroll on unmount
   */
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsSidebarOpen(false);
        }
      };
      
      window.addEventListener('keydown', onKeyDown);
      
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKeyDown);
      };
    }
    
    // Restore normal scroll when sidebar closes
    document.body.style.overflow = '';
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb]">
      {/* Navbar with hamburger menu (mobile) */}
      <Navbar 
        onMenuClick={() => setIsSidebarOpen((prev) => !prev)} 
        isSidebarOpen={isSidebarOpen}
        dashboardPath={dashboardPath}
      />
      
      {/* Main content area: Sidebar + Page */}
      <div className="flex flex-1 relative">
        {/* Role-based Sidebar */}
        <Sidebar
          role={user?.role}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden w-full min-w-0">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
