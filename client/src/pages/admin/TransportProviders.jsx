import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { logisticsService } from '../../services/logisticsService';
import { logisticsRegions, vehicleTypes } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import { apiErrorKey, dataLabel } from '../../utils/i18nKeys';
const EMPTY = { name: '', phone: '', vehicleType: vehicleTypes[0], capacityKg: '', regionsServed: [], ratePerQuintalPerKm: '', isAvailable: true, notes: '' };
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#333' };

export default function AdminTransportProviders() {
  const { t, formatNumber, formatDate } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = closed; object = open (with _id when editing)
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setProviders(await logisticsService.getProviders());
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error')));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const toggleRegion = (region) => {
    const has = form.regionsServed.includes(region);
    setForm({ ...form, regionsServed: has ? form.regionsServed.filter((r) => r !== region) : [...form.regionsServed, region] });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, capacityKg: Number(form.capacityKg) };
      if (form._id) await logisticsService.updateProvider(form._id, payload);
      else await logisticsService.createProvider(payload);
      toast.success(t('lg_saved'));
      setForm(null);
      load();
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await logisticsService.deleteProvider(id);
      toast.success(t('lg_deleted'));
      load();
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error')));
    }
  };

  if (loading) return <LoadingSpinner fullScreen={false} label={t('common_loading')} />;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#1b5e20', margin: 0 }}>{t('lg_admin_providers_title')}</h2>
        {!form && (
          <button onClick={() => setForm({ ...EMPTY })} style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            + {t('lg_add_provider')}
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={handleSave} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div><label style={labelStyle}>{t('lg_name')}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('lg_phone')}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>{t('lg_vehicle_type')}</label>
            <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} style={inputStyle}>
              {vehicleTypes.map((v) => <option key={v} value={v}>{dataLabel(t, 'vehicle', v)}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>{t('lg_capacity_kg')}</label><input type="number" min="1" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })} required style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('lg_rate')}</label><input type="number" min="0" step="any" value={form.ratePerQuintalPerKm ?? ''} onChange={(e) => setForm({ ...form, ratePerQuintalPerKm: e.target.value })} style={inputStyle} /></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>{t('lg_regions_served')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {logisticsRegions.map((r) => (
                <label key={r} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: form.regionsServed.includes(r) ? '#e8f5e9' : '#f5f5f5', padding: '0.3rem 0.6rem', borderRadius: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.regionsServed.includes(r)} onChange={() => toggleRegion(r)} /> {r}
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>{t('lg_notes')}</label><textarea rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={inputStyle} /></div>
          <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} /> {t('lg_available_for_jobs')}
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving} style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{t('lg_save')}</button>
            <button type="button" onClick={() => setForm(null)} style={{ background: 'none', border: '1px solid #999', color: '#555', padding: '0.6rem 1.2rem', borderRadius: '4px', cursor: 'pointer' }}>{t('lg_cancel_btn')}</button>
          </div>
        </form>
      )}

      {providers.length === 0 ? (
        <p style={{ color: '#666' }}>{t('lg_dir_empty')}</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: '#f1f8f2' }}>
                {[t('lg_name'), t('lg_phone'), t('lg_vehicle'), t('lg_capacity'), t('lg_regions_served'), t('lg_status'), ''].map((h, i) => <th key={i} style={{ padding: '0.7rem' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p._id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '0.7rem' }}>{p.name}</td>
                  <td style={{ padding: '0.7rem' }}>{p.phone}</td>
                  <td style={{ padding: '0.7rem' }}>{dataLabel(t, 'vehicle', p.vehicleType)}</td>
                  <td style={{ padding: '0.7rem' }}>{formatNumber(p.capacityKg)} {t('unit_kg')}</td>
                  <td style={{ padding: '0.7rem' }}>{p.regionsServed.join(', ')}</td>
                  <td style={{ padding: '0.7rem' }}>{p.isAvailable ? t('lg_available') : t('lg_unavailable')}</td>
                  <td style={{ padding: '0.7rem', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setForm({ ...p })} style={{ marginRight: '0.4rem', cursor: 'pointer' }}>{t('lg_edit')}</button>
                    <button onClick={() => handleDelete(p._id)} style={{ color: '#c62828', cursor: 'pointer' }}>{t('lg_delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
