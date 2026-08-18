import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { reportService } from '../../services/reportService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [statsData, reportData] = await Promise.all([
          adminService.getStats(),
          reportService.generateAdminReport(),
        ]);
        if (isMounted) {
          setStats(statsData);
          setReport(reportData);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load analytics.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading analytics..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1.5rem' }}>📈 Analytics</h2>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total Users" value={stats.totalUsers} color="#1b5e20" />
          <StatCard label="Farmers" value={stats.totalFarmers} color="#2e7d32" />
          <StatCard label="Buyers" value={stats.totalBuyers} color="#1976d2" />
          <StatCard label="Extension Workers" value={stats.totalExtensionWorkers} color="#e65100" />
        </div>
      )}

      {report && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1b5e20', fontSize: '1.05rem' }}>Sales Snapshot</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <StatCard label="Total Orders" value={report.data.totalOrders} color="#1976d2" />
            <StatCard label="Total Revenue" value={`${Number(report.data.totalRevenue).toLocaleString()} ETB`} color="#1b5e20" />
            <StatCard label="Products Listed" value={report.data.totalProducts} color="#f57c00" />
          </div>
          {report.data.ordersByStatus && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#555' }}>
              {Object.entries(report.data.ordersByStatus).map(([status, count]) => (
                <span key={status} style={{ marginRight: '1rem' }}>{status}: <strong>{count}</strong></span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
}
