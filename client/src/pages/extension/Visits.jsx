import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { extensionService } from '../../services/extensionService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey } from '../../utils/i18nKeys';
export default function ExtensionVisits() {
  const { t, formatDate } = useLanguage();
  const [farmers, setFarmers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [farmerId, setFarmerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [farmerList, visitList] = await Promise.all([
        extensionService.getFarmersList(),
        extensionService.getMyVisits(),
      ]);
      setFarmers(farmerList);
      setVisits(visitList);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_visits_load_error', 'ext_visits_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmerId) {
      toast.error(t('ext_visits_select_farmer_err'));
      return;
    }
    if (!notes.trim()) {
      toast.error(t('ext_visits_notes_err'));
      return;
    }

    setIsSubmitting(true);
    try {
      await extensionService.createVisit({ farmerId, notes: notes.trim() });
      toast.success(t('ext_visits_logged'));
      setFarmerId('');
      setNotes('');
      loadData();
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'ext_visits_log_error', 'ext_visits_log_error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('visits_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('ext_visits_subtitle')}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('role_farmer')}</label>
          <select
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white' }}
          >
            <option value="">{t('ext_visits_select_farmer')}</option>
            {farmers.map((f) => (
              <option key={f._id} value={f._id}>{f.fullName} — {f.phone || t('ext_visits_no_phone')}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{t('ext_visits_notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('ext_visits_notes_placeholder')}
            rows={3}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? t('ext_visits_logging') : t('ext_visits_log')}
        </button>
      </form>

      <h3 style={{ color: '#1b5e20', marginBottom: '1rem' }}>{t('ext_visits_history')}</h3>
      {isLoading ? (
        <LoadingSpinner fullScreen={false} label={t('common_loading')} />
      ) : visits.length === 0 ? (
        <p style={{ color: '#666' }}>{t('ext_visits_empty')}</p>
      ) : (
        visits.map((visit) => (
          <div
            key={visit._id}
            style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '0.75rem' }}
          >
            <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{visit.farmer?.fullName || t('buyer_unknown_farmer')}</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: '#555' }}>{visit.notes}</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>{formatDate(visit.visitDate)}</p>
          </div>
        ))
      )}
    </div>
  );
}
