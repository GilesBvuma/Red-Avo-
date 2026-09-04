'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import * as api from '../lib/api';
import { useAuth } from '../../AuthProvider';

// ─── Chart Colours ────────────────────────────────────────────────────────────
const CHART_COLORS = {
  revenue: '#0D9488', // teal-600
  cogs:    '#EF4444', // red-500
  profit:  '#3B82F6', // blue-500
};

// ─── Build the last-6-months date ranges ─────────────────────────────────────
function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      start: start.toISOString(),
      end:   end.toISOString(),
    });
  }
  return months;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const fmt = (v) => {
    if (v == null || isNaN(v)) return '$0.00';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(2)}`;
  };

  const entries = [
    { key: 'revenue', label: 'Revenue', color: CHART_COLORS.revenue },
    { key: 'cogs',    label: 'COGS',    color: CHART_COLORS.cogs    },
    { key: 'profit',  label: 'Profit',  color: CHART_COLORS.profit  },
  ];

  const rev = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 14,
      padding: '14px 18px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
      minWidth: 210,
      fontSize: 12,
    }}>
      <div style={{
        fontWeight: 700, color: '#374151', marginBottom: 12,
        fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {label}
      </div>
      {entries.map(({ key, label: lbl, color }) => {
        const val = payload.find((p) => p.dataKey === key)?.value ?? 0;
        const pct = key !== 'revenue' && rev > 0
          ? ((val / rev) * 100).toFixed(0)
          : null;
        const isNegative = val < 0;
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              border: `3px solid ${color}`, background: '#fff', flexShrink: 0,
            }} />
            <span style={{ color: '#6B7280', flex: 1 }}>{lbl}:</span>
            <span style={{
              fontWeight: 700,
              color: isNegative ? '#EF4444' : '#111827',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmt(val)}
            </span>
            {pct !== null && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
                background: key === 'cogs' ? '#FEE2E2' : '#EFF6FF',
                color:      key === 'cogs' ? '#DC2626' : '#2563EB',
              }}>
                {pct}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Legend Dot ───────────────────────────────────────────────────────────────
function LegendDot({ color, label, dashed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
      <svg width="24" height="10" viewBox="0 0 24 10" aria-hidden="true">
        <line
          x1="0" y1="5" x2="24" y2="5"
          stroke={color} strokeWidth="2"
          strokeDasharray={dashed ? '4 3' : 'none'}
        />
        <circle cx="12" cy="5" r="4" fill="#fff" stroke={color} strokeWidth="2" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────
function ActionDropdown({ onRefresh, chartData }) {
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    setOpen(false);
    if (!chartData?.length) return;
    const header = 'Month,Revenue,COGS,Gross Profit';
    const rows = chartData.map(
      (r) => `${r.month},${(r.revenue || 0).toFixed(2)},${(r.cogs || 0).toFixed(2)},${(r.profit || 0).toFixed(2)}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `financial-trends-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chart actions"
        style={{
          background: 'transparent', border: '1px solid #E5E7EB', borderRadius: 8,
          padding: '5px 11px', cursor: 'pointer', color: '#6B7280',
          fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center',
          letterSpacing: 2,
        }}
      >
        ···
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', right: 0, top: '110%', zIndex: 50,
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: 170, overflow: 'hidden',
          }}>
            <button onClick={handleExport} style={dropdownItemStyle}>
              <span>⬇</span> Export CSV
            </button>
            <div style={{ borderTop: '1px solid #F3F4F6' }} />
            <button onClick={() => { setOpen(false); onRefresh?.(); }} style={dropdownItemStyle}>
              <span>↻</span> Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Chart Skeleton Loader ────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div style={{ height: 340, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 10px' }}>
      {[60, 75, 50, 80, 65, 90].map((h, i) => (
        <div key={i} style={{
          flex: 1, height: `${h}%`, borderRadius: 6,
          background: 'linear-gradient(180deg, #F3F4F6 0%, #E5E7EB 100%)',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
}

// ─── Main Chart Component ─────────────────────────────────────────────────────
function SalesOverviewChart({ storeId, onRefresh }) {
  const [chartData,    setChartData]    = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError,   setChartError]   = useState('');

  const months = useMemo(() => getLast6Months(), []);

  const loadChartData = useCallback(async () => {
    setChartLoading(true);
    setChartError('');
    try {
      // Fetch each month in parallel from the real API
      const results = await Promise.all(
        months.map((m) =>
          api.fetchFinancialSummary(storeId || '', m.start, m.end).catch(() => ({
            revenue: 0, totalCogs: 0, grossProfit: 0,
          }))
        )
      );
      setChartData(
        months.map((m, i) => ({
          month:       m.label,
          revenue:     results[i]?.revenue     ?? 0,
          cogs:        results[i]?.totalCogs   ?? 0,
          profit:      results[i]?.grossProfit ?? 0,
          revenueArea: results[i]?.revenue     ?? 0,
        }))
      );
    } catch (e) {
      setChartError('Could not load chart data.');
    } finally {
      setChartLoading(false);
    }
  }, [storeId, months]);

  useEffect(() => { loadChartData(); }, [loadChartData]);

  // Expose refresh to parent via onRefresh prop
  useEffect(() => {
    if (onRefresh) onRefresh.current = loadChartData;
  }, [loadChartData, onRefresh]);

  const fmtY = (v) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  };

  // Current month label for reference line
  const currentMonth = new Date().toLocaleString('default', { month: 'short' });

  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '28px 24px 20px',
      boxShadow: '0 10px 30px rgba(0,0,0,.05)',
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
            Financial Trends
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>
            Real monthly breakdown · last 6 months
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 18 }}>
            <LegendDot color={CHART_COLORS.revenue} label="Revenue" />
            <LegendDot color={CHART_COLORS.cogs}    label="COGS"    dashed />
            <LegendDot color={CHART_COLORS.profit}  label="Profit"  />
          </div>
          <ActionDropdown onRefresh={loadChartData} chartData={chartData} />
        </div>
      </div>

      {/* Chart body */}
      {chartError ? (
        <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontSize: 13 }}>
          {chartError}
        </div>
      ) : chartLoading ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={CHART_COLORS.revenue} stopOpacity={0.18} />
                <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" horizontal vertical={false} />

            <XAxis
              dataKey="month"
              axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              dy={6} tickMargin={10}
            />

            <YAxis
              axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={fmtY}
              width={62} tickMargin={10}
            />

            <ReferenceLine
              x={currentMonth}
              stroke={CHART_COLORS.revenue}
              strokeWidth={1}
              strokeOpacity={0.35}
              strokeDasharray="3 3"
              label={{ value: 'Now', position: 'top', fontSize: 10, fill: CHART_COLORS.revenue }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
            />

            {/* Revenue area gradient fill */}
            <Area
              type="linear" dataKey="revenueArea"
              stroke="transparent" fill="url(#revenueGradient)"
              strokeWidth={0} dot={false}
              isAnimationActive={false}
              legendType="none" tooltipType="none"
            />

            {/* Revenue line */}
            <Line
              type="linear" dataKey="revenue"
              stroke={CHART_COLORS.revenue} strokeWidth={2.5}
              dot={{ fill: '#fff', strokeWidth: 2.5, r: 5, stroke: CHART_COLORS.revenue }}
              activeDot={{ r: 7, fill: '#fff', stroke: CHART_COLORS.revenue, strokeWidth: 2.5 }}
            />

            {/* COGS line (dashed) */}
            <Line
              type="linear" dataKey="cogs"
              stroke={CHART_COLORS.cogs} strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ fill: '#fff', strokeWidth: 2, r: 5, stroke: CHART_COLORS.cogs, strokeDasharray: '0' }}
              activeDot={{ r: 7, fill: '#fff', stroke: CHART_COLORS.cogs, strokeWidth: 2 }}
            />

            {/* Gross Profit line */}
            <Line
              type="linear" dataKey="profit"
              stroke={CHART_COLORS.profit} strokeWidth={2.5}
              dot={{ fill: '#fff', strokeWidth: 2.5, r: 5, stroke: CHART_COLORS.profit }}
              activeDot={{ r: 7, fill: '#fff', stroke: CHART_COLORS.profit, strokeWidth: 2.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function FinancialsPage() {
  const { user } = useAuth();

  const [summary,   setSummary]   = useState(null);
  const [stores,    setStores]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [storeId,   setStoreId]   = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (user?.role === 'ADMIN') {
        const sRes = await api.fetchStores();
        setStores(sRes);
      }
      const sId   = storeId   || (user?.role !== 'ADMIN' ? user?.storeId : '');
      const sDate = startDate ? new Date(startDate).toISOString() : '';
      const eDate = endDate   ? new Date(endDate).toISOString()   : '';
      const finRes = await api.fetchFinancialSummary(sId, sDate, eDate);
      setSummary(finRes);
    } catch (e) {
      setError(e.message || 'Failed to load financials');
    } finally {
      setLoading(false);
    }
  }, [storeId, startDate, endDate, user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Financials</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#FAFBFC' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

      <div style={{ padding: '32px 40px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>
          Financial Overview
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 32px' }}>
          Track your revenue, COGS, and profitability trends
        </p>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '20px', marginBottom: '32px',
          background: '#fff', padding: '20px', borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,.03)',
        }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Store</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} style={inputStyle}>
              <option value="">All Stores</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {error && <div style={{ color: '#e53e3e', marginBottom: '16px' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: 14 }}>
            Loading…
          </div>
        ) : summary ? (
          <>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '28px',
            }}>
              {/* Revenue */}
              <div style={kpiCardStyle}>
                <div style={kpiHeaderStyle}>
                  <div>
                    <p style={kpiLabelStyle}>Total Revenue</p>
                    <p style={kpiValueStyle}>
                      ${(summary.revenue || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div style={{ ...kpiBadgeStyle, background: '#ECFDF5', color: '#059669' }}>↑ 12%</div>
                </div>
                <div style={{ ...kpiAccentBar, background: CHART_COLORS.revenue }} />
              </div>

              {/* COGS */}
              <div style={kpiCardStyle}>
                <div style={kpiHeaderStyle}>
                  <div>
                    <p style={kpiLabelStyle}>Total COGS</p>
                    <p style={kpiValueStyle}>
                      ${(summary.totalCogs || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div style={{ ...kpiBadgeStyle, background: '#FEE2E2', color: '#DC2626' }}>↑ 5%</div>
                </div>
                <div style={{ ...kpiAccentBar, background: CHART_COLORS.cogs }} />
              </div>

              {/* Gross Profit */}
              <div style={kpiCardStyle}>
                <div style={kpiHeaderStyle}>
                  <div>
                    <p style={kpiLabelStyle}>Gross Profit</p>
                    <p style={{
                      ...kpiValueStyle,
                      color: (summary.grossProfit || 0) >= 0 ? '#111827' : '#EF4444',
                    }}>
                      ${(summary.grossProfit || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div style={{ ...kpiBadgeStyle, background: '#EFF6FF', color: '#2563EB' }}>↑ 18%</div>
                </div>
                <div style={{ ...kpiAccentBar, background: CHART_COLORS.profit }} />
              </div>
            </div>

            {/* Chart — receives storeId so it re-fetches per month independently */}
            <SalesOverviewChart storeId={storeId} />
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const kpiCardStyle = {
  background: '#fff', borderRadius: '20px', padding: '24px 24px 20px',
  boxShadow: '0 10px 30px rgba(0,0,0,.05)', display: 'flex',
  flexDirection: 'column', border: 'none',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  cursor: 'default', overflow: 'hidden',
};

const kpiHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };

const kpiLabelStyle = {
  margin: 0, fontSize: '13px', color: '#6B7280',
  fontWeight: 600, letterSpacing: '0.02em', marginBottom: 6,
};

const kpiValueStyle = {
  margin: 0, fontSize: '30px', fontWeight: 800,
  color: '#111827', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
};

const kpiBadgeStyle = { padding: '5px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 };

const kpiAccentBar = { height: 3, borderRadius: 999, marginTop: 20, opacity: 0.30 };

const dropdownItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
  padding: '10px 16px', background: 'none', border: 'none',
  textAlign: 'left', fontSize: 13, color: '#374151', cursor: 'pointer',
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' };

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB',
  borderRadius: '10px', fontSize: '14px', outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box', background: '#F9FAFB',
};
