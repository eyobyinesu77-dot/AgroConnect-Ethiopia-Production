import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isFarmerProfileComplete } from '../utils/profileCompletion';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * ProtectedRoute Component - Production Ready
 * 
 * A wrapper component that protects routes by verifying:
 * 1. User is authenticated (has valid token)
 * 2. User has required role (if allowedRoles specified)
 * 3. User doesn't need to change password
 * 4. User profile is complete (farmers must complete profile)
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 *                                   Example: ['farmer'], ['admin'], ['buyer']
 *                                   If not specified, only checks authentication
 * 
 * @returns {JSX.Element} - Protected component or redirect
 * 
 * Redirect Behavior:
 * - No token/user → /login (with return location in state)
 * - Wrong role → / (home page)
 * - mustChangePassword flag → /change-password
 * - Farmer with incomplete profile → /farmer/complete-profile
 * 
 * @example
 * // Protect admin-only route
 * <Route path="/admin/dashboard" 
 *   element={<ProtectedRoute allowedRoles={['admin']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>} 
 * />
 * 
 * // Protect farmer-only route with profile completion check
 * <Route path="/farmer/dashboard"
 *   element={<ProtectedRoute allowedRoles={['farmer']}>
 *     <FarmerDashboard />
 *   </ProtectedRoute>}
 * />
 * 
 * // Protect multi-role route
 * <Route path="/marketplace"
 *   element={<ProtectedRoute allowedRoles={['buyer', 'admin']}>
 *     <Marketplace />
 *   </ProtectedRoute>}
 * />
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  // STEP 1: Check if auth context is still loading
  // Show loading spinner while verifying session from localStorage
  if (loading) {
    return <LoadingSpinner label="Checking your session..." />;
  }

  // STEP 2: Check if user is authenticated
  // If no token or user object, they're not logged in
  // Save current location so we can redirect back after login
  if (!token || !user) {
    return <Navigate 
      to="/login" 
      state={{ from: location }} 
      replace 
    />;
  }

  // STEP 3: Check if user has required role
  // If allowedRoles is specified and user role is not in list, deny access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(
      `Access denied: User role '${user.role}' not in allowed roles:`,
      allowedRoles
    );
    return <Navigate to="/" replace />;
  }

  // STEP 4: Check if user must change password
  // If password reset is required, force them to change password first
  // Exception: allow if they're already on /change-password page
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // STEP 5: Check if farmer has completed profile
  // Farmers MUST complete their profile (add region, zone, woreda, kebele, fayidaId)
  // before accessing the farmer dashboard
  // Exception: allow if they're already on /farmer/complete-profile page
  if (user.role === 'farmer' && 
      !isFarmerProfileComplete(user) && 
      location.pathname !== '/farmer/complete-profile') {
    console.info('Farmer profile incomplete, redirecting to profile completion');
    return <Navigate to="/farmer/complete-profile" replace />;
  }

  // STEP 5b: The reverse case — a farmer whose profile IS already complete
  // has no reason to be on the completion form. Without this, any stale
  // link back to /farmer/complete-profile (a bookmark, browser back button,
  // a leftover redirect from before profile completion) lets them reopen
  // the form and resubmit the same Fayida ID they already saved, which is
  // exactly what produces a duplicate-key error on that unique field.
  // Bounce them straight to the dashboard instead.
  if (user.role === 'farmer' &&
      isFarmerProfileComplete(user) &&
      location.pathname === '/farmer/complete-profile') {
    return <Navigate to="/farmer/dashboard" replace />;
  }

  // All checks passed, render the protected component
  return children;
}
