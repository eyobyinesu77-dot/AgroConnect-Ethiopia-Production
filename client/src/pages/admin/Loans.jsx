import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { loanService } from '../../services/loanService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_COLORS = {
  Pending: { bg: '#fff8e1', text: '#f57f17' },
  Approved: { bg: '#e8f5e9', text: '#2e7d32' },
  Rejected: { bg: '#ffebee', text: '#c62828' },
};

export default function AdminLoans() {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadLoans = async () => {
    try {
      const data = await loanService.getAllLoans();
      setLoans(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load loans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleDecision = async (id, status) => {
    setUpdatingId(id);
    try {
      await loanService.updateLoanStatus(id, status);
      setLoans((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
      toast.success(`Loan ${status.toLowerCase()}.`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update loan.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading loan requests..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>💰 Loan Requests</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Approve or reject farmers' loan requests.</p>

      {loans.length === 0 ? (
        <p style={{ color: '#666' }}>No loan requests yet.</p>
      ) : (
        loans.map((loan) => {
          const colors = STATUS_COLORS[loan.status] || STATUS_COLORS.Pending;
          return (
            <div
              key={loan._id}
              style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {loan.cropImage && (
                  <img
                    src={loan.cropImage}
                    alt="Crop"
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee', flexShrink: 0 }}
                  />
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
                    {loan.farmer?.fullName || 'Unknown Farmer'} — {Number(loan.amount).toLocaleString()} ETB
                  </p>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#777' }}>{loan.reason}</p>
                  {loan.bankType && (
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>{loan.bankType}{loan.duration ? ` · ${loan.duration}` : ''}</p>
                  )}
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                    {loan.farmer?.phone || 'no phone'} · {[loan.farmer?.region, loan.farmer?.zone].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ padding: '0.35rem 0.7rem', borderRadius: '4px', backgroundColor: colors.bg, color: colors.text, fontWeight: 'bold', fontSize: '0.8rem' }}>
                  {loan.status}
                </span>
                {loan.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleDecision(loan._id, 'Approved')}
                      disabled={updatingId === loan._id}
                      style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecision(loan._id, 'Rejected')}
                      disabled={updatingId === loan._id}
                      style={{ backgroundColor: '#c62828', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
