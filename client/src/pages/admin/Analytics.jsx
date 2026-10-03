import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { reportService } from '../../services/reportService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

import { apiErrorKey, geoLabel } from '../../utils/i18nKeys';
export default function AdminAnalytics() {
  const { t, formatNumber, formatDate } = useLanguage();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // The sales snapshot (reportService.generateAdminReport) persists a Report
  // document every time it is called, so it is fetched only on the first
  // load. The auto-refresh below polls only the read-only endpoints.
  const loadData = async (includeReport = false) => {
    try {
      const [statsData, analyticsData, reportData] = await Promise.all([
        adminService.getStats(),
        adminService.getAnalytics(),
        includeReport ? reportService.generateAdminReport() : Promise.resolve(null),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
      if (reportData) setReport(reportData);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'analytics_load_error', 'analytics_load_error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // PRD-054: "Dashboard auto-refreshes" — re-pull every 60s so the
    // numbers stay current without the admin needing to reload the page.
    const interval = setInterval(() => loadData(false), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await adminService.exportAnalyticsCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agroconnect-weekly-summary-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(t(apiErrorKey(error, 'analytics_export_error', 'analytics_export_error')));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} label={t('analytics_loading')} />;
  }

  const maxWeekCount = Math.max(1, ...(analytics?.registeredUsersOverTime || []).map((w) => w.count));
  const maxCropRevenue = Math.max(1, ...(analytics?.topCrops || []).map((c) => c.revenue));
  const maxRegionRevenue = Math.max(1, ...(analytics?.topRegions || []).map((r) => r.revenue));

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ color: '#1b5e20', margin: 0 }}>📈 {t('analytics_title')}</h2>
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '4px', fontWeight: 'bold', cursor: isExporting ? 'default' : 'pointer', opacity: isExporting ? 0.7 : 1 }}
        >
          {isExporting ? t('analytics_exporting') : `⬇️ ${t('analytics_export_csv')}`}
        </button>
      </div>

      {/* PRD-054's 6 headline metrics */}
      {stats && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label={t('analytics_total_users')} value={stats.totalUsers} color="#1b5e20" />
          <StatCard label={t('analytics_active_users')} value={analytics.activeUsers} sub={t('analytics_active_users_sub')} color="#00897b" />
          <StatCard label={t('analytics_gmv')} value={`${formatNumber(analytics.gmv)} ${t('unit_etb')}`} color="#1976d2" />
          <StatCard label={t('analytics_farmers')} value={stats.totalFarmers} color="#2e7d32" />
          <StatCard label={t('analytics_buyers')} value={stats.totalBuyers} color="#f57c00" />
          <StatCard
            label={t('analytics_ussd_sessions')}
            value={analytics.ussdAvailable ? analytics.ussdSessionCount : t('analytics_not_available')}
            sub={!analytics.ussdAvailable ? t('analytics_ussd_not_built') : undefined}
            color="#9e9e9e"
          />
        </div>
      )}

      {/* Registered users over time */}
      <Panel title={t('analytics_users_over_time')}>
        {analytics?.registeredUsersOverTime?.length ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px' }}>
            {analytics.registeredUsersOverTime.map((w) => (
              <div key={w.weekStart} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  title={`${w.count}`}
                  style={{ backgroundColor: '#2e7d32', borderRadius: '3px 3px 0 0', height: `${Math.max(4, (w.count / maxWeekCount) * 100)}px`, marginBottom: '0.3rem' }}
                />
                <span style={{ fontSize: '0.65rem', color: '#888' }}>{formatDate(w.weekStart, { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote text={t('analytics_no_data')} />
        )}
      </Panel>

      {/* Top crops */}
      <Panel title={t('analytics_top_crops')}>
        {analytics?.topCrops?.length ? (
          <RankedBars items={analytics.topCrops.map((c) => ({ label: c.crop, value: c.revenue, max: maxCropRevenue }))} unit={` ${t('unit_etb')}`} />
        ) : (
          <EmptyNote text={t('analytics_no_data')} />
        )}
      </Panel>

      {/* Top regions */}
      <Panel title={t('analytics_top_regions')}>
        {analytics?.topRegions?.length ? (
          <RankedBars items={analytics.topRegions.map((r) => ({ label: geoLabel(t, r.region), value: r.revenue, max: maxRegionRevenue }))} unit=" ETB" />
        ) : (
          <EmptyNote text={t('analytics_no_data')} />
        )}
      </Panel>

      {/* Existing sales snapshot */}
      {report && (
        <Panel title={t('analytics_sales_snapshot')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <StatCard label={t('analytics_total_orders')} value={report.data.totalOrders} color="#1976d2" />
            <StatCard label={t('analytics_total_revenue')} value={`${formatNumber(report.data.totalRevenue)} ${t('unit_etb')}`} color="#1b5e20" />
            <StatCard label={t('analytics_products_listed')} value={report.data.totalProducts} color="#f57c00" />
          </div>
          {report.data.ordersByStatus && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#555' }}>
              {Object.entries(report.data.ordersByStatus).map(([status, count]) => (
                <span key={status} style={{ marginRight: '1rem' }}>{status}: <strong>{count}</strong></span>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#1b5e20', fontSize: '1.05rem' }}>{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', padding: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</p>
      {sub && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: '#999' }}>{sub}</p>}
    </div>
  );
}

function RankedBars({ items, unit }) {
  const { formatNumber } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#333', marginBottom: '0.2rem' }}>
            <span>{item.label}</span>
            <span style={{ color: '#888' }}>{formatNumber(item.value)}{unit}</span>
          </div>
          <div style={{ backgroundColor: '#eef2ee', borderRadius: '4px', height: '8px' }}>
            <div style={{ backgroundColor: '#2e7d32', borderRadius: '4px', height: '100%', width: `${Math.max(4, (item.value / item.max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyNote({ text }) {
  return <p style={{ color: '#999', fontSize: '0.85rem', margin: 0 }}>{text}</p>;
}
