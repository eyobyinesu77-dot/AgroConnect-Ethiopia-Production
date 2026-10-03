import React from 'react';
import LogisticsPanel from '../../components/logistics/LogisticsPanel';
import { useAuth } from '../../hooks/useAuth';

// Farmers default the pickup region to the region on their profile.
export default function FarmerLogistics() {
  const { user } = useAuth();
  return <LogisticsPanel defaultPickupRegion={user?.region || ''} />;
}
