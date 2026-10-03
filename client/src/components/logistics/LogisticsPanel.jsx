import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { logisticsService } from '../../services/logisticsService';
import { logisticsRegions, productUnits } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';
import ProviderDirectory from './ProviderDirectory';

import { apiErrorKey, dataLabel } from '../../utils/i18nKeys';
export const statusKey = (status) => `lg_status_${status.toLowerCase().replace(/\s+/g, '_')}`;

const EMPTY_FORM = {
  cropName: '', quantity: '', unit: 'Quintal', pickupRegion: '', pickupZone: '', pickupWoreda: '',
  destinationRegion: '', destinationAddress: '', preferredDate: '', notes: '',
};

const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' };

// Shared by the farmer and buyer Logistics pages: request transport, follow
// existing requests, and browse the provider directory.
export default function LogisticsPanel({ defaultPickupRegion = '' }) {
  const { t, formatNumber } = useLanguage();
  const [tab, setTab] = useState('request');
  const [form, setForm] = useState({ ...EMPTY_FORM, pickupRegion: defaultPickupRegion });
  const [submitting, setSubmitting] = useState(false);
  const [matches, setMatches] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      setRequests(await logisticsService.getMyRequests());
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error')));
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
      if (!payload.preferredDate) delete payload.preferredDate;
      const result = await logisticsService.createRequest(payload);
      toast.success(t('lg_success'));
      setMatches(result.matches);
      setForm({ ...EMPTY_FORM, pickupRegion: form.pickupRegion });
      loadRequests();
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await logisticsService.cancelRequest(id);
      loadRequests();
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error')));
    }
  };

  const tabs = [
    { id: 'request', label: t('lg_tab_request') },
    { id: 'mine', label: t('lg_tab_my_requests') },
    { id: 'directory', label: t('lg_tab_directory') },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '0.5rem' }}>{t('lg_title')}</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('lg_subtitle')}</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            style={{ padding: '0.55rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600,
              backgroundColor: tab === x.id ? '#2e7d32' : '#e8f5e9', color: tab === x.id ? 'white' : '#1b5e20' }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'request' && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{t('lg_crop')}</label>
              <input name="cropName" value={form.cropName} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lg_quantity')}</label>
              <input name="quantity" type="number" min="0.01" step="any" value={form.quantity} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lg_unit')}</label>
              <select name="unit" value={form.unit} onChange={handleChange} style={inputStyle}>
                {productUnits.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('lg_pickup_region')}</label>
              <select name="pickupRegion" value={form.pickupRegion} onChange={handleChange} required style={inputStyle}>
                <option value="">{t('lg_select_region')}</option>
                {logisticsRegions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('lg_pickup_zone')}</label>
              <input name="pickupZone" value={form.pickupZone} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lg_pickup_woreda')}</label>
              <input name="pickupWoreda" value={form.pickupWoreda} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lg_dest_region')}</label>
              <select name="destinationRegion" value={form.destinationRegion} onChange={handleChange} required style={inputStyle}>
                <option value="">{t('lg_select_region')}</option>
                {logisticsRegions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('lg_dest_address')}</label>
              <input name="destinationAddress" value={form.destinationAddress} onChange={handleChange} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lg_pref_date')}</label>
              <input name="preferredDate" type="date" value={form.preferredDate} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{t('lg_notes')}</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? t('lg_submitting') : t('lg_submit')}
              </button>
            </div>
          </form>

          {matches && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
              <h3 style={{ color: '#1b5e20', fontSize: '1rem' }}>{t('lg_matches_title')}</h3>
              {matches.length === 0 ? (
                <p style={{ color: '#666' }}>{t('lg_no_matches')}</p>
              ) : (
                matches.map((m) => (
                  <div key={m.provider._id} style={{ padding: '0.6rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                    <strong>{m.provider.name}</strong> — {dataLabel(t, 'vehicle', m.provider.vehicleType)}, {formatNumber(m.provider.capacityKg)} {t('unit_kg')}
                    {m.servesDestination && <span style={{ color: '#2e7d32' }}> · {t('lg_serves_dest')}</span>}
                    <div style={{ color: '#777', fontSize: '0.8rem' }}>
                      {formatNumber(m.spareCapacityKg)} {t('unit_kg')} {t('lg_spare')} · 📞 {m.provider.phone}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'mine' && (
        loadingRequests ? <p style={{ color: '#666' }}>{t('common_loading')}</p>
        : requests.length === 0 ? <p style={{ color: '#666' }}>{t('lg_empty_requests')}</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map((r) => (
              <div key={r._id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ color: '#1b5e20' }}>{dataLabel(t, 'crop', r.cropName)} — {formatNumber(r.quantity)} {dataLabel(t, 'unit', r.unit)}</strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1976d2' }}>{t(statusKey(r.status))}</span>
                </div>
                <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#555' }}>
                  {r.pickupRegion} → {r.destinationRegion}, {r.destinationAddress}
                </p>
                {r.assignedProvider && (
                  <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#2e7d32' }}>
                    {t('lg_assigned_to')}: {r.assignedProvider.name} · 📞 {r.assignedProvider.phone}
                  </p>
                )}
                {r.status === 'Pending' && (
                  <button onClick={() => handleCancel(r._id)} style={{ marginTop: '0.4rem', background: 'none', border: '1px solid #c62828', color: '#c62828', borderRadius: '4px', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
                    {t('lg_cancel_request')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'directory' && <ProviderDirectory />}
    </div>
  );
}
