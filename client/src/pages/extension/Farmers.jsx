import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ExtensionFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await extensionService.getFarmersList();
        if (isMounted) setFarmers(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load farmers.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading farmers..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>👨‍🌾 My Assigned Farmers</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>List of farmers assigned to you.</p>

      {farmers.length === 0 ? (
        <p style={{ color: '#666' }}>No farmers assigned to you yet. Ask an admin to assign farmers to your account.</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((farmer) => (
                <tr key={farmer._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{farmer.fullName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{farmer.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{[farmer.region, farmer.zone, farmer.woreda].filter(Boolean).join(' / ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
