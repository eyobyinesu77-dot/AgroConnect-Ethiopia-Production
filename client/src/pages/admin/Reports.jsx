import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reportService } from '../../services/reportService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadReports = async () => {
    try {
      const data = await reportService.getMyReports();
      setReports(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await reportService.generateAdminReport();
      toast.success('Sales report generated.');
      loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#1b5e20', margin: 0 }}>📊 Sales Reports</h2>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          {isGenerating ? 'Generating...' : '+ Generate New Report'}
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Revenue analysis calculated from orders and payments.</p>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} label="Loading reports..." />
      ) : reports.length === 0 ? (
        <p style={{ color: '#666' }}>No reports generated yet — click "Generate New Report" above.</p>
      ) : (
        reports.map((report) => (
          <div key={report._id} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#999' }}>
              {new Date(report.createdAt).toLocaleString()}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Total Orders</p>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#1976d2' }}>{report.data.totalOrders}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Total Revenue</p>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#1b5e20' }}>
                  {Number(report.data.totalRevenue).toLocaleString()} ETB
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Total Products Listed</p>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: '#f57c00' }}>{report.data.totalProducts}</p>
              </div>
            </div>
            {report.data.ordersByStatus && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#555' }}>
                {Object.entries(report.data.ordersByStatus).map(([status, count]) => (
                  <span key={status} style={{ marginRight: '1rem' }}>{status}: <strong>{count}</strong></span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
