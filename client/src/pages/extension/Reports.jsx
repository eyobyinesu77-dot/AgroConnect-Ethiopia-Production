import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { reportService } from '../../services/reportService';

export default function ExtensionReports() {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await reportService.generateExtensionReport();
      setReport(data);
      toast.success('Report generated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>📊 My Activity Report</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>A summary of your farm visit activity.</p>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '4px', fontWeight: 'bold', cursor: isGenerating ? 'not-allowed' : 'pointer', marginBottom: '1.5rem' }}
      >
        {isGenerating ? 'Generating...' : '📈 Generate My Activity Report'}
      </button>

      {report && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Total Visits Logged</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>{report.data.totalVisits}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Unique Farmers Visited</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1b5e20' }}>{report.data.farmersVisited}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
