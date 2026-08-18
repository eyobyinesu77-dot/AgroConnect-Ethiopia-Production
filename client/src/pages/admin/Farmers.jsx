import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [extensionWorkers, setExtensionWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  const load = async () => {
    try {
      const [farmersData, workersData] = await Promise.all([
        adminService.getFarmers(),
        adminService.getExtensionWorkers(),
      ]);
      setFarmers(farmersData);
      setExtensionWorkers(workersData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load farmers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAssign = async (farmerId, extensionWorkerId) => {
    setAssigningId(farmerId);
    try {
      const result = await adminService.assignExtensionWorker(farmerId, extensionWorkerId || null);
      setFarmers((prev) => prev.map((f) => (f._id === farmerId ? result.farmer : f)));
      toast.success(extensionWorkerId ? 'Extension worker assigned.' : 'Extension worker unassigned.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update assignment.');
    } finally {
      setAssigningId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading farmers..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>👨‍🌾 Farmers</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        {farmers.length} registered farmers. Assign each farmer to an extension worker so the worker can see and manage them.
      </p>

      {farmers.length === 0 ? (
        <p style={{ color: '#666' }}>No farmers registered yet.</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', fontSize: '0.85rem', color: '#555' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Assigned Extension Worker</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f._id} style={{ borderTop: '1px solid #eee', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{f.fullName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{f.phone || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{[f.region, f.zone, f.woreda].filter(Boolean).join(' / ')}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={f.assignedExtensionWorker?._id || ''}
                      onChange={(e) => handleAssign(f._id, e.target.value)}
                      disabled={assigningId === f._id}
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', minWidth: '180px' }}
                    >
                      <option value="">-- Unassigned --</option>
                      {extensionWorkers.map((w) => (
                        <option key={w._id} value={w._id}>{w.fullName}</option>
                      ))}
                    </select>
                  </td>
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
