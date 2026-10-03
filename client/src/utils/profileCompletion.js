/**
 * Check if a farmer's profile is complete.
 * 
 * A farmer's profile is considered complete when they have:
 * - All address fields: region, zone, woreda, kebele
 * - Fayida ID (13-digit national ID)
 * 
 * @param {Object} user - The user object from AuthContext
 * @returns {boolean} - True if profile is complete, false otherwise
 */
export function isFarmerProfileComplete(user) {
  if (!user || user.role !== 'farmer') {
    return true; // Non-farmers are always "complete"
  }

  // Check if all required fields are filled
  const hasRegion = !!user.region?.trim();
  const hasZone = !!user.zone?.trim();
  const hasWoreda = !!user.woreda?.trim();
  const hasKebele = !!user.kebele?.trim();
  const hasFayidaId = !!user.fayidaId?.trim();

  return hasRegion && hasZone && hasWoreda && hasKebele && hasFayidaId;
}

/**
 * Get the appropriate dashboard path based on user role and profile completion.
 * 
 * - Farmer (Profile Incomplete): /farmer/complete-profile
 * - Farmer (Profile Complete): /farmer/dashboard
 * - Buyer: /buyer/marketplace
 * - Extension: /extension/dashboard
 * - Admin: /admin/dashboard
 * - Other: /
 * 
 * @param {Object} user - The user object from AuthContext
 * @returns {string} - The redirect path
 */
export function getPostLoginRedirectPath(user) {
  if (!user) return '/';

  if (user.role === 'farmer') {
    return isFarmerProfileComplete(user) ? '/farmer/dashboard' : '/farmer/complete-profile';
  }

  const roleRoutes = {
    buyer: '/buyer/marketplace',
    extension: '/extension/dashboard',
    admin: '/admin/dashboard',
  };

  return roleRoutes[user.role] || '/';
}
