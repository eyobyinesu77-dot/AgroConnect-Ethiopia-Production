import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supportService } from '../../services/supportService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { tOr, supportCategoryKey, supportLanguageKey, apiErrorKey } from '../../utils/i18nKeys';

const STATUS_COLORS = {
  New: { bg: '#fff8e1', text: '#f57f17' },
  Read: { bg: '#e3f2fd', text: '#1565c0' },
  Replied: { bg: '#e8f5e9', text: '#2e7d32' },
  Archived: { bg: '#f5f5f5', text: '#757575' },
};

const STATUS_OPTIONS = ['New', 'Read', 'Replied', 'Archived'];
const STATUS_LABEL_KEYS = {
  New: 'support_status_new',
  Read: 'support_status_read',
  Replied: 'support_status_replied',
  Archived: 'support_status_archived',
};

export default function AdminSupport() {
  const { t, formatNumber, formatDate } = useLanguage();
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
        toast.error(t(apiErrorKey(error, 'admin_support_load_error', 'admin_support_load_error')));
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
      toast.error(t(apiErrorKey(error, 'admin_support_update_error', 'admin_support_update_error')));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await supportService.deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t._id !== id));
      toast.success(t('admin_support_deleted'));
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'admin_support_delete_error', 'admin_support_delete_error')));
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
    return <LoadingSpinner fullScreen={false} label={t('admin_support_loading')} />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('admin_support_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1rem' }}>{t('admin_support_subtitle').replace('{shown}', filteredTickets.length).replace('{total}', tickets.length)}</p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder={t('admin_support_search_ph')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white' }}
        >
          <option value="All">{t('admin_support_all_statuses')}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{t(STATUS_LABEL_KEYS[s])}</option>
          ))}
        </select>
      </div>

      {filteredTickets.length === 0 ? (
        <p style={{ color: '#666' }}>{tickets.length === 0 ? t('admin_support_empty_none') : t('admin_support_empty_filtered')}</p>
      ) : (
        filteredTickets.map((ticket) => {
          const colors = STATUS_COLORS[ticket.status] || STATUS_COLORS.New;
          return (
            <div key={ticket._id} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
                    {ticket.user?.fullName || ticket.guestName || t('admin_support_anonymous')}
                    <span style={{ fontWeight: 'normal', color: '#999', fontSize: '0.8rem' }}> ({ticket.user?.email || ticket.guestEmail || t('admin_support_no_email')}{ticket.phone ? ` · ${ticket.phone}` : ''})</span>
                  </p>
                  {ticket.subject && <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: '#444', fontSize: '0.9rem' }}>{ticket.subject}</p>}
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                    {tOr(t, supportCategoryKey(ticket.category), ticket.category)} · {tOr(t, supportLanguageKey(ticket.language), ticket.language)} · {formatDate(ticket.createdAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                    disabled={updatingId === ticket._id}
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
                      <option key={s} value={s}>{t(STATUS_LABEL_KEYS[s])}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(ticket._id)}
                    disabled={deletingId === ticket._id}
                    style={{ fontSize: '0.75rem', color: '#c62828', border: '1px solid #c62828', background: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', cursor: 'pointer' }}
                  >
                    {deletingId === ticket._id ? '...' : t('common_delete')}
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{ticket.message}</p>
            </div>
          );
        })
      )}
    </div>
  );
}
