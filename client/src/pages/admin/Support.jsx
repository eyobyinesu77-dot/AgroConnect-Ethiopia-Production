import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supportService } from '../../services/supportService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_COLORS = {
  New: { bg: '#fff8e1', text: '#f57f17' },
  Read: { bg: '#e3f2fd', text: '#1565c0' },
  Replied: { bg: '#e8f5e9', text: '#2e7d32' },
  Archived: { bg: '#f5f5f5', text: '#757575' },
};

const STATUS_OPTIONS = ['New', 'Read', 'Replied', 'Archived'];

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await supportService.getAllTickets();
        if (isMounted) setTickets(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load support tickets.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await supportService.updateTicketStatus(id, status);
      setTickets((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ticket.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await supportService.deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t._id !== id));
      toast.success('Ticket deleted.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete ticket.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (t.user?.fullName || t.guestName || '').toLowerCase();
    const email = (t.user?.email || t.guestEmail || '').toLowerCase();
    return (
      name.includes(term) ||
      email.includes(term) ||
      (t.subject || '').toLowerCase().includes(term) ||
      (t.message || '').toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label="Loading support tickets..." />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>🎧 Support Tickets</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>{filteredTickets.length} of {tickets.length} inquiries shown.</p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by name, email, subject, or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white' }}
        >
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {filteredTickets.length === 0 ? (
        <p style={{ color: '#666' }}>{tickets.length === 0 ? 'No support tickets yet.' : 'No tickets match your search/filter.'}</p>
      ) : (
        filteredTickets.map((t) => {
          const colors = STATUS_COLORS[t.status] || STATUS_COLORS.New;
          return (
            <div key={t._id} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
                    {t.user?.fullName || t.guestName || 'Anonymous'}
                    <span style={{ fontWeight: 'normal', color: '#999', fontSize: '0.8rem' }}> ({t.user?.email || t.guestEmail || 'no email'}{t.phone ? ` · ${t.phone}` : ''})</span>
                  </p>
                  {t.subject && <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: '#444', fontSize: '0.9rem' }}>{t.subject}</p>}
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                    {t.category} · {t.language} · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t._id, e.target.value)}
                    disabled={updatingId === t._id}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: 'none',
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(t._id)}
                    disabled={deletingId === t._id}
                    style={{ fontSize: '0.75rem', color: '#c62828', border: '1px solid #c62828', background: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}
                  >
                    {deletingId === t._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{t.message}</p>
            </div>
          );
        })
      )}
    </div>
  );
}
