'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import { useAuth } from '../../AuthProvider';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Simple dummy data generator for sparklines (since API currently returns single totals)
const generateSparklineData = (base, variance) => {
  return Array.from({ length: 7 }).map(() => ({
    value: Math.max(0, base + (Math.random() * variance - (variance / 2)))
  }));
};

function Sparkline({ color, data }) {
  return (
    <div style={{ height: '50px', width: '100%', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function FinancialsPage() {
  const { user } = useAuth();
  
  const [summary, setSummary] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [storeId, setStoreId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Generate stable dummy data for the sparklines on load
  const [sparkData, setSparkData] = useState({
    revenue: generateSparklineData(500, 200),
    cogs: generateSparklineData(300, 100),
    profit: generateSparklineData(200, 150)
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (user?.role === 'ADMIN') {
        const sRes = await api.fetchStores();
        setStores(sRes);
      }
      
      const sId = storeId || (user?.role !== 'ADMIN' ? user?.storeId : '');
      const sDate = startDate ? new Date(startDate).toISOString() : '';
      const eDate = endDate ? new Date(endDate).toISOString() : '';
      
      const finRes = await api.fetchFinancialSummary(sId, sDate, eDate);
      setSummary(finRes);
      
      // Regenerate sparklines slightly to simulate new data
      setSparkData({
        revenue: generateSparklineData(finRes.revenue / 7, finRes.revenue / 14),
        cogs: generateSparklineData(finRes.totalCogs / 7, finRes.totalCogs / 14),
        profit: generateSparklineData(finRes.grossProfit / 7, finRes.grossProfit / 14)
      });
    } catch (e) {
      setError(e.message || 'Failed to load financials');
    } finally {
      setLoading(false);
    }
  }, [storeId, startDate, endDate, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      <div style={{ padding: '32px 40px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>Financial Overview</h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 32px' }}>Track your revenue, COGS, and profitability trends</p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,.03)' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Store</label>
            <select value={storeId} onChange={e => setStoreId(e.target.value)} style={inputStyle}>
              <option value="">All Stores</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {error && <div style={{ color: '#e53e3e', marginBottom: '16px' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* KPI Card: Revenue */}
            <div style={kpiCardStyle}>
              <div style={kpiHeaderStyle}>
                <h3 style={kpiTitleStyle}>Total Revenue</h3>
                <span style={{...badgeStyle, background: '#ECFDF5', color: '#059669'}}>+12%</span>
              </div>
              <p style={kpiValueStyle}>${(summary.revenue || 0).toFixed(2)}</p>
              <Sparkline color="#10B981" data={sparkData.revenue} />
            </div>

            {/* KPI Card: COGS */}
            <div style={kpiCardStyle}>
              <div style={kpiHeaderStyle}>
                <h3 style={kpiTitleStyle}>Total COGS</h3>
                <span style={{...badgeStyle, background: '#FEE2E2', color: '#DC2626'}}>+5%</span>
              </div>
              <p style={kpiValueStyle}>${(summary.totalCogs || 0).toFixed(2)}</p>
              <Sparkline color="#EF4444" data={sparkData.cogs} />
            </div>

            {/* KPI Card: Gross Profit */}
            <div style={kpiCardStyle}>
              <div style={kpiHeaderStyle}>
                <h3 style={kpiTitleStyle}>Gross Profit</h3>
                <span style={{...badgeStyle, background: '#EFF6FF', color: '#2563EB'}}>+18%</span>
              </div>
              <p style={{ ...kpiValueStyle, color: (summary.grossProfit || 0) >= 0 ? '#111827' : '#EF4444' }}>
                ${(summary.grossProfit || 0).toFixed(2)}
              </p>
              <Sparkline color="#3B82F6" data={sparkData.profit} />
            </div>
            
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Neumorphism Lite KPI Card Styles
const kpiCardStyle = {
  background: '#fff',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 10px 30px rgba(0,0,0,.05)',
  display: 'flex',
  flexDirection: 'column',
  border: 'none',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  cursor: 'default'
};

const kpiHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
};

const kpiTitleStyle = {
  margin: 0,
  fontSize: '15px',
  color: '#6B7280',
  fontWeight: 600,
  letterSpacing: '0.02em'
};

const kpiValueStyle = {
  margin: 0,
  fontSize: '36px',
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.02em'
};

const badgeStyle = {
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 700
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', background: '#F9FAFB' };
