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
  const [requestPortions, setRequestPortions] = useState({}); // kg allocated per request
  const [batchProviderChoice, setBatchProviderChoice] = useState({});
  const [batchPortions, setBatchPortions] = useState({});
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

  // Use capacity remaining after active allocations, not rated capacity alone.
  const providerRemainingKg = (p) =>
    Math.max(0, Number(p.remainingCapacityKg ?? p.capacityKg) || 0);

  const providersForRequest = (r, quantityKg) => {
    const eligible = providers.filter((p) =>
      p.isAvailable !== false &&
      providerRemainingKg(p) >= quantityKg &&
      Array.isArray(p.regionsServed) &&
      p.regionsServed.includes(r.pickupRegion) &&
      p.regionsServed.includes(r.destinationRegion)
    );
    return { list: eligible, matched: eligible.length > 0, underCapacityOnly: false };
  };

  const providersForBatch = (b) => {
    const eligible = providers.filter((p) =>
      p.isAvailable !== false &&
      providerRemainingKg(p) > 0 &&
      Array.isArray(p.regionsServed) &&
      p.regionsServed.includes(b.pickupRegion) &&
      p.regionsServed.includes(b.destinationRegion)
    );
    return {
      list: eligible,
      matched: eligible.length > 0,
      underCapacityOnly: false,
    };
  };

  const handleAllocateBatch = (b) => {
    const providerId = batchProviderChoice[b._id];

    if (!providerId) {
      toast.error('Choose a transport provider first.');
      return;
    }

    const portions = [];
    for (const r of (b.requests || [])) {
      const raw = batchPortions[b._id]?.[r._id];
      if (raw === undefined || String(raw).trim() === '') continue;

      const quantityKg = Number(raw);
      const remainingKg = Math.max(
        0,
        Number(r.quantityKg || 0) - Number(r.allocatedQuantityKg || 0)
      );

      if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
        toast.error('Each allocation must be a positive kg amount.');
        return;
      }

      if (quantityKg > remainingKg) {
        toast.error(`Allocation for a request cannot exceed ${remainingKg} kg remaining.`);
        return;
      }

      portions.push({ requestId: r._id, quantityKg });
    }

    if (!portions.length) {
      toast.error('Enter a positive kg amount for at least one request.');
      return;
    }

    const total = portions.reduce((sum, p) => sum + p.quantityKg, 0);
    const provider = providers.find((p) => p._id === providerId);

    if (provider && total > providerRemainingKg(provider)) {
      toast.error(`Allocation total exceeds provider remaining capacity of ${providerRemainingKg(provider)} kg.`);
      return;
    }

    run(
      b._id,
      () => logisticsService.allocateBatch(b._id, providerId, portions),
      'lg_assigned_ok'
    );
  };

  const handleAssignRequest = (r) => {
    const providerId = choice[r._id];
    const allocatedKg = Number(r.allocatedQuantityKg || 0);
    const remainingKg = Math.max(0, Number(r.quantityKg || 0) - allocatedKg);
    const quantityKg = Number(requestPortions[r._id] ?? String(remainingKg));
    const provider = providers.find((p) => p._id === providerId);

    if (!providerId) {
      toast.error(t('lg_select_provider_first'));
      return;
    }
    if (!Number.isFinite(quantityKg) || quantityKg <= 0 || quantityKg > remainingKg) {
      toast.error(`Enter a positive allocation no greater than ${remainingKg} kg remaining.`);
      return;
    }
    if (!provider || quantityKg > providerRemainingKg(provider)) {
      toast.error(`Allocation must not exceed the selected provider's remaining capacity of ${provider ? providerRemainingKg(provider) : 0} kg.`);
      return;
    }

    run(
      r._id,
      () => logisticsService.allocateRequest(r._id, providerId, quantityKg),
      'lg_assigned_ok'
    );
  };

  const handleAssignBatch = (b) => {
    const providerId = choice[b._id];
    if (!providerId) {
      toast.error(t('lg_select_provider_first'));
      return;
    }
    run(b._id, () => logisticsService.assignBatchProvider(b._id, providerId), 'lg_assigned_ok');
  };

  const renderProviderSelect = (id, options, matched, underCapacityOnly = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '220px' }}>
      <select
        value={choice[id] || ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '__none__') return;
          if (v && !options.some((p) => p._id === v)) return;
          setChoice({ ...choice, [id]: v });
        }}
        style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '220px' }}
        aria-label={t('lg_choose_provider')}
      >
        <option value="">{t('lg_choose_provider')}</option>
        {providers.map((p) => {
          const eligible = options.some((candidate) => candidate._id === p._id);
          return (
            <option key={p._id} value={p._id} disabled={!eligible}>
              {p.name} ({formatNumber(providerRemainingKg(p))} kg remaining)
              {p.phone ? ` · ${p.phone}` : ''}
              {!eligible ? ' · Not eligible (region/capacity)' : ''}
            </option>
          );
        })}
      </select>
      {providers.length === 0 && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#c62828' }}>
          {t('lg_no_providers')}{' '}
          <a href="/admin/transport-providers" style={{ color: '#1565c0', textDecoration: 'underline' }}>
            {t('nav_transport_providers') || 'Transport Providers'}
          </a>
        </p>
      )}
      {providers.length > 0 && !matched && !underCapacityOnly && (
        <span style={{ fontSize: '0.75rem', color: '#e65100' }}>
          No provider matches this request's regions and capacity.
        </span>
      )}
      {underCapacityOnly && (
        <span style={{ fontSize: '0.75rem', color: '#c62828' }}>
          No provider has enough capacity for this load. Assign will be rejected unless capacity is increased.
        </span>
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

      {providers.length === 0 && (
        <div
          style={{
            backgroundColor: '#fff3e0',
            border: '1px solid #ffcc80',
            borderRadius: '8px',
            padding: '0.9rem 1.1rem',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            color: '#e65100',
          }}
        >
          {t('lg_no_providers')}{' '}
          <a
            href="/admin/transport-providers"
            style={{ color: '#1565c0', fontWeight: 600, textDecoration: 'underline' }}
          >
            {t('nav_transport_providers') || 'Transport Providers'}
          </a>
          {' — '}Add at least one provider with capacity ≥ 5000 kg and the regions used in pending requests.
        </div>
      )}

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
            const allocatedKg = Number(r.allocatedQuantityKg || 0);
            const remainingKg = Math.max(0, Number(r.quantityKg || 0) - allocatedKg);
            const rawPortionKg = requestPortions[r._id] ?? String(remainingKg);
            const portionKg = rawPortionKg.trim() === '' ? NaN : Number(rawPortionKg);
            const validPortionKg =
              Number.isFinite(portionKg) &&
              portionKg > 0 &&
              portionKg <= remainingKg;
            const { list: fits, matched, underCapacityOnly } = providersForRequest(r, portionKg);
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
                <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#555' }}>
                  Allocated: {formatNumber(allocatedKg)} kg · Remaining: {formatNumber(remainingKg)} kg
                </p>
                {r.assignedProvider && (
                  <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#2e7d32' }}>
                    {t('lg_assigned_to')}: {r.assignedProvider.name} · {r.assignedProvider.phone}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem', alignItems: 'flex-start' }}>
                  {['Pending', 'Partially Assigned'].includes(r.status) && remainingKg > 0 && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px' }}>
                        <label htmlFor={`request-portion-${r._id}`} style={{ fontSize: '0.8rem' }}>
                          Allocate quantity (kg)
                        </label>
                        <input
                          id={`request-portion-${r._id}`}
                          type="number"
                          min="0.01"
                          max={remainingKg}
                          step="any"
                          value={requestPortions[r._id] ?? String(remainingKg)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRequestPortions((prev) => ({ ...prev, [r._id]: value }));
                          }}
                          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        />
                      </div>
                      {renderProviderSelect(r._id, fits, matched, underCapacityOnly)}
                      <button
                        type="button"
                        disabled={isAssigning || providers.length === 0 || !validPortionKg || !choice[r._id]}
                        onClick={() => handleAssignRequest(r)}
                        style={{
                          ...btn(),
                          opacity: isAssigning || providers.length === 0 || !validPortionKg || !choice[r._id] ? 0.6 : 1,
                          cursor: isAssigning || providers.length === 0 || !validPortionKg || !choice[r._id] ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isAssigning ? t('lg_assigning') : t('lg_assign')}
                      </button>
                    </>
                  )}
                  {(r.allocations || []).map((allocation) => (
                    <div
                      key={allocation._id}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        marginTop: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem' }}>
                        {allocation.provider?.name || 'Transport provider'}
                        {' · '}
                        {formatNumber(allocation.requestPortionQuantityKg)} kg
                        {' · '}
                        {tOr(t, logisticsStatusKey(allocation.status), allocation.status)}
                      </span>
                      {allocation.status === 'Assigned' && (
                        <button
                          type="button"
                          disabled={assigning === allocation._id}
                          onClick={() => run(
                            allocation._id,
                            () => logisticsService.updateAllocationStatus(
                              allocation._id,
                              'In Transit'
                            ),
                            'lg_status_updated'
                          )}
                          style={btn('#1976d2')}
                        >
                          {t('lg_mark_in_transit')}
                        </button>
                      )}
                      {allocation.status === 'In Transit' && (
                        <button
                          type="button"
                          disabled={assigning === allocation._id}
                          onClick={() => run(
                            allocation._id,
                            () => logisticsService.updateAllocationStatus(
                              allocation._id,
                              'Delivered'
                            ),
                            'lg_status_updated'
                          )}
                          style={btn()}
                        >
                          {t('lg_mark_delivered')}
                        </button>
                      )}
                    </div>
                  ))}
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
                  <button
                    type="button"
                    onClick={() =>
                      run(key, () => logisticsService.createBatch(s.requestIds), 'lg_batch_created')
                    }
                    style={btn()}
                  >
                    {t('lg_create_batch')}
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
            const { list: eligibleProviders } = providersForBatch(b);
            const isAssigning = assigning === b._id;
            const allocatedKg = Number(b.allocatedQuantityKg || 0);
            const remainingBatchKg = Math.max(0, Number(b.totalQuantityKg || 0) - allocatedKg);
            const canAllocate = ['Open', 'Partially Assigned'].includes(b.status);

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
                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#555' }}>
                  Allocated: {formatNumber(allocatedKg)} kg · Remaining: {formatNumber(remainingBatchKg)} kg
                </p>

                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#555' }}>
                  {(b.requests || []).map((r) => {
                    const requestKg = Number(r.quantityKg || 0);
                    const requestAllocatedKg = Number(r.allocatedQuantityKg || 0);
                    const requestRemainingKg = Math.max(0, requestKg - requestAllocatedKg);

                    return (
                      <li key={r._id} style={{ marginBottom: '0.65rem' }}>
                        <div>
                          {r.requester?.fullName || r.requester?.phone}: {r.cropName}
                          {' · '}Total {formatNumber(requestKg)} kg
                          {' · '}Allocated {formatNumber(requestAllocatedKg)} kg
                          {' · '}Remaining {formatNumber(requestRemainingKg)} kg
                        </div>
                        {canAllocate && requestRemainingKg > 0 && (
                          <label style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.25rem' }}>
                            Allocate kg:
                            <input
                              type="number"
                              min="0"
                              max={requestRemainingKg}
                              step="0.01"
                              value={batchPortions[b._id]?.[r._id] ?? ''}
                              onChange={(e) => setBatchPortions((previous) => ({
                                ...previous,
                                [b._id]: {
                                  ...(previous[b._id] || {}),
                                  [r._id]: e.target.value,
                                },
                              }))}
                              style={{ width: '110px', padding: '0.35rem', border: '1px solid #ccc', borderRadius: '4px' }}
                              aria-label={`Allocation kg for ${r.cropName}`}
                            />
                          </label>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {(b.allocations || []).length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Transport allocations</strong>
                    {(b.allocations || []).map((allocation) => (
                      <div
                        key={allocation._id}
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          padding: '0.65rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        <div>
                          <strong>
                            {allocation.provider?.name || 'Transport provider'}
                          </strong>
                          {' · '}
                          {formatNumber(allocation.totalQuantityKg)} kg
                          {' · '}
                          {tOr(t, logisticsStatusKey(allocation.status), allocation.status)}
                        </div>

                        {(allocation.requestPortions || []).map((portion, index) => (
                          <div
                            key={String(portion.request?._id || portion.request || index)}
                            style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}
                          >
                            {portion.request?.requester?.fullName ||
                              portion.request?.requester?.phone ||
                              'Farmer'}
                            {portion.request?.cropName
                              ? ' · ' + portion.request.cropName
                              : ''}
                            {' · '}
                            {formatNumber(portion.quantityKg)} kg
                          </div>
                        ))}

                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginTop: '0.5rem',
                        }}>
                          {allocation.status === 'Assigned' && (
                            <button
                              type="button"
                              disabled={assigning === allocation._id}
                              onClick={() => run(
                                allocation._id,
                                () => logisticsService.updateAllocationStatus(
                                  allocation._id,
                                  'In Transit'
                                ),
                                'lg_status_updated'
                              )}
                              style={btn('#1976d2')}
                            >
                              {t('lg_mark_in_transit')}
                            </button>
                          )}

                          {allocation.status === 'In Transit' && (
                            <button
                              type="button"
                              disabled={assigning === allocation._id}
                              onClick={() => run(
                                allocation._id,
                                () => logisticsService.updateAllocationStatus(
                                  allocation._id,
                                  'Delivered'
                                ),
                                'lg_status_updated'
                              )}
                              style={btn()}
                            >
                              {t('lg_mark_delivered')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {canAllocate && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '0.5rem' }}>
                    <select
                      value={batchProviderChoice[b._id] || ''}
                      onChange={(e) => setBatchProviderChoice((previous) => ({
                        ...previous,
                        [b._id]: e.target.value,
                      }))}
                      style={{ padding: '0.45rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '220px' }}
                      aria-label="Choose provider for batch allocation"
                    >
                      <option value="">Choose transport provider</option>
                      {providers.map((p) => {
                        const eligible = eligibleProviders.some((candidate) => candidate._id === p._id);
                        return (
                        <option key={p._id} value={p._id} disabled={!eligible}>
                          {p.name} ({formatNumber(providerRemainingKg(p))} kg remaining){p.phone ? ` · ${p.phone}` : ''}{!eligible ? ' · Not eligible (region/capacity)' : ''}
                        </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      disabled={isAssigning || eligibleProviders.length === 0 || remainingBatchKg <= 0}
                      onClick={() => handleAllocateBatch(b)}
                      style={{
                        ...btn(),
                        opacity: isAssigning || eligibleProviders.length === 0 || remainingBatchKg <= 0 ? 0.6 : 1,
                        cursor: isAssigning || eligibleProviders.length === 0 || remainingBatchKg <= 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isAssigning ? 'Allocating…' : 'Allocate selected portions'}
                    </button>
                    {eligibleProviders.length === 0 && (
                      <span style={{ color: '#b71c1c', fontSize: '0.85rem' }}>
                        No available provider serves both regions.
                      </span>
                    )}
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
