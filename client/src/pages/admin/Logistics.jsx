import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { logisticsService } from '../../services/logisticsService';
import { useLanguage } from '../../context/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { statusKey } from '../../components/logistics/LogisticsPanel';
import { tOr, unitKey, logisticsStatusKey, apiErrorKey } from '../../utils/i18nKeys';

const cardStyle = { backgroundColor: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' };
const btn = (bg = '#2e7d32') => ({ backgroundColor: bg, color: 'white', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' });

export default function AdminLogistics() {
  const { t, formatNumber } = useLanguage();
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [providers, setProviders] = useState([]);
  const [choice, setChoice] = useState({}); // per-row selected provider id
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null); // id currently being assigned

  const load = useCallback(async () => {
    try {
      const [r, s, b, p] = await Promise.all([
        logisticsService.getAllRequests(),
        logisticsService.getSuggestions(),
        logisticsService.getBatches(),
        logisticsService.getProviders({ available: 'true' }),
      ]);
      setRequests(Array.isArray(r) ? r : []);
      setSuggestions(Array.isArray(s) ? s : []);
      setBatches(Array.isArray(b) ? b : []);
      setProviders(Array.isArray(p) ? p : []);
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_load_error', 'lg_load_error')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const run = async (id, fn, successKey) => {
    setAssigning(id);
    try {
      await fn();
      toast.success(t(successKey));
      setChoice((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } catch (err) {
      toast.error(t(apiErrorKey(err, 'lg_assign_failed', 'lg_load_error')));
    } finally {
      setAssigning(null);
    }
  };

  /** Prefer region+capacity match; if none, fall back to capacity-ok available providers so Assign is never blocked by region alone. */
  const providersForRequest = (r) => {
    const capacityOk = providers.filter((p) => p.capacityKg >= r.quantityKg);
    const matching = capacityOk.filter(
      (p) => Array.isArray(p.regionsServed) && p.regionsServed.includes(r.pickupRegion)
    );
    if (matching.length > 0) return { list: matching, matched: true };
    // Fallback: any available provider with enough capacity (region optional)
    if (capacityOk.length > 0) return { list: capacityOk, matched: false };
    return { list: [], matched: false };
  };

  const providersForBatch = (b) => {
    const capacityOk = providers.filter((p) => p.capacityKg >= b.totalQuantityKg);
    const matching = capacityOk.filter(
      (p) => Array.isArray(p.regionsServed) && p.regionsServed.includes(b.pickupRegion)
    );
    if (matching.length > 0) return { list: matching, matched: true };
    if (capacityOk.length > 0) return { list: capacityOk, matched: false };
    return { list: [], matched: false };
  };

  const handleAssignRequest = (r) => {
    const providerId = choice[r._id];
    if (!providerId) {
      toast.error(t('lg_select_provider_first'));
      return;
    }
    run(r._id, () => logisticsService.assignProvider(r._id, providerId), 'lg_assigned_ok');
  };

  const handleAssignBatch = (b) => {
    const providerId = choice[b._id];
    if (!providerId) {
      toast.error(t('lg_select_provider_first'));
      return;
    }
    run(b._id, () => logisticsService.assignBatchProvider(b._id, providerId), 'lg_assigned_ok');
  };

  const renderProviderSelect = (id, options, matched) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px' }}>
      <select
        value={choice[id] || ''}
        onChange={(e) => setChoice({ ...choice, [id]: e.target.value })}
        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
        aria-label={t('lg_choose_provider')}
      >
        <option value="">{t('lg_choose_provider')}</option>
        {options.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name} ({formatNumber(p.capacityKg)} {t('unit_kg')}){p.phone ? ` · ${p.phone}` : ''}
          </option>
        ))}
      </select>
      {options.length === 0 && (
        <span style={{ fontSize: '0.75rem', color: '#c62828' }}>{t('lg_no_providers')}</span>
      )}
      {options.length > 0 && !matched && (
        <span style={{ fontSize: '0.75rem', color: '#e65100' }}>{t('lg_no_exact_match')}</span>
      )}
    </div>
  );

  if (loading) return <LoadingSpinner fullScreen={false} label={t('common_loading')} />;

  const tabs = [
    { id: 'requests', label: `${t('lg_all_requests')} (${requests.length})` },
    { id: 'aggregation', label: `${t('lg_aggregation')} (${suggestions.length})` },
    { id: 'batches', label: `${t('lg_batches')} (${batches.length})` },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b5e20', marginBottom: '1.25rem' }}>{t('lg_admin_title')}</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              backgroundColor: tab === x.id ? '#2e7d32' : '#e8f5e9',
              color: tab === x.id ? 'white' : '#1b5e20',
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'requests' && (requests.length === 0 ? (
        <p style={{ color: '#666' }}>{t('lg_no_requests')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map((r) => {
            const { list: fits, matched } = providersForRequest(r);
            const isAssigning = assigning === r._id;
            return (
              <div key={r._id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ color: '#1b5e20' }}>
                    {r.cropName} — {formatNumber(r.quantity)} {tOr(t, unitKey(r.unit), r.unit)} ({formatNumber(r.quantityKg)} {t('unit_kg')})
                  </strong>
                  <span style={{ fontWeight: 600, color: '#1976d2', fontSize: '0.85rem' }}>{t(statusKey(r.status))}</span>
                </div>
                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#555' }}>
                  {t('lg_requester')}: {r.requester?.fullName || r.requester?.email} ({tOr(t, `role_${r.requester?.role}`, r.requester?.role)}) · {r.requester?.phone}
                </p>
                <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#555' }}>
                  {r.pickupRegion} → {r.destinationRegion}
                  {r.destinationAddress ? `, ${r.destinationAddress}` : ''}
                </p>
                {r.assignedProvider && (
                  <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#2e7d32' }}>
                    {t('lg_assigned_to')}: {r.assignedProvider.name} · {r.assignedProvider.phone}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'flex-start' }}>
                  {r.status === 'Pending' && (
                    <>
                      {renderProviderSelect(r._id, fits, matched)}
                      <button
                        type="button"
                        disabled={isAssigning || providers.length === 0}
                        onClick={() => handleAssignRequest(r)}
                        style={{
                          ...btn(),
                          opacity: isAssigning || providers.length === 0 ? 0.6 : 1,
                          cursor: isAssigning || providers.length === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isAssigning ? t('lg_assigning') : t('lg_assign')}
                      </button>
                    </>
                  )}
                  {r.status === 'Assigned' && (
                    <button
                      type="button"
                      onClick={() => run(r._id, () => logisticsService.updateStatus(r._id, 'In Transit'), 'lg_status_updated')}
                      style={btn('#1976d2')}
                    >
                      {t('lg_mark_in_transit')}
                    </button>
                  )}
                  {r.status === 'In Transit' && (
                    <button
                      type="button"
                      onClick={() => run(r._id, () => logisticsService.updateStatus(r._id, 'Delivered'), 'lg_status_updated')}
                      style={btn()}
                    >
                      {t('lg_mark_delivered')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {tab === 'aggregation' && (suggestions.length === 0 ? (
        <p style={{ color: '#666' }}>{t('lg_no_suggestions')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {suggestions.map((s) => {
            const key = `${s.pickupRegion}|${s.destinationRegion}`;
            const matchProviders = (s.matches || []).map((m) => m.provider).filter(Boolean);
            const options = matchProviders.length > 0 ? matchProviders : providers;
            const matched = matchProviders.length > 0;
            return (
              <div key={key} style={cardStyle}>
                <strong style={{ color: '#1b5e20' }}>{s.pickupRegion} → {s.destinationRegion}</strong>
                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#555' }}>
                  {s.requestCount} {t('lg_requests_count')} · {(s.crops || []).join(', ')} · {t('lg_combined_load')}: {formatNumber(s.totalQuantityKg)} {t('unit_kg')}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '0.5rem' }}>
                  {renderProviderSelect(key, options, matched)}
                  <button
                    type="button"
                    onClick={() =>
                      run(key, () => logisticsService.createBatch(s.requestIds, choice[key] || undefined), 'lg_batch_created')
                    }
                    style={btn()}
                  >
                    {choice[key] ? t('lg_create_batch_assign') : t('lg_create_batch')}
                  </button>
                </div>
                {matchProviders.length === 0 && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#c62828' }}>{t('lg_no_matches')}</p>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {tab === 'batches' && (batches.length === 0 ? (
        <p style={{ color: '#666' }}>{t('lg_no_batches')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {batches.map((b) => {
            const { list: fits, matched } = providersForBatch(b);
            const isAssigning = assigning === b._id;
            return (
              <div key={b._id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#1b5e20' }}>{b.pickupRegion} → {b.destinationRegion}</strong>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1976d2' }}>
                    {tOr(t, logisticsStatusKey(b.status), b.status)}
                  </span>
                </div>
                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#555' }}>
                  {(b.requests || []).length} {t('lg_requests_count')} · {t('lg_combined_load')}: {formatNumber(b.totalQuantityKg)} {t('unit_kg')}
                </p>
                <ul style={{ margin: '0.3rem 0', paddingLeft: '1.1rem', fontSize: '0.82rem', color: '#666' }}>
                  {(b.requests || []).map((r) => (
                    <li key={r._id}>
                      {r.requester?.fullName || r.requester?.phone}: {r.cropName}, {formatNumber(r.quantity)} {tOr(t, unitKey(r.unit), r.unit)}
                    </li>
                  ))}
                </ul>
                {b.provider && (
                  <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#2e7d32' }}>
                    {t('lg_assigned_to')}: {b.provider.name} · {b.provider.phone}
                  </p>
                )}
                {b.status === 'Open' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '0.5rem' }}>
                    {renderProviderSelect(b._id, fits, matched)}
                    <button
                      type="button"
                      disabled={isAssigning || providers.length === 0}
                      onClick={() => handleAssignBatch(b)}
                      style={{
                        ...btn(),
                        opacity: isAssigning || providers.length === 0 ? 0.6 : 1,
                        cursor: isAssigning || providers.length === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isAssigning ? t('lg_assigning') : t('lg_assign_to_batch')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
