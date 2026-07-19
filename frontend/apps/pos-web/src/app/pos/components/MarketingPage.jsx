'use client';

import { useState } from 'react';
import BulkNotifyPanel from './BulkNotifyPanel'; // Re-use the existing component for now

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('campaigns');

  const tabs = [
    { id: 'campaigns', label: 'Campaigns & Bulk Notify' },
    { id: 'segments', label: 'Customer Segments' },
    { id: 'automations', label: 'Automations' }
  ];

  return (
    <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', background: '#F5F5F5' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: '#111827' }}>Marketing & Communications</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Engage with your customers through SMS, Email, and WhatsApp campaigns.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '2rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === tab.id ? '#111827' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#4B5563',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', border: '1px solid #E5E7EB', minHeight: '500px' }}>
        {activeTab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <div style={{ width: '100%' }}>
              <h3 style={{ marginTop: 0 }}>Draft a New Campaign</h3>
              <p style={{ color: '#6B7280', fontSize: '13px' }}>Use the panel to send bulk notifications directly to your customers.</p>
              <div style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Wrap BulkNotifyPanel to match its styling expectations */}
                <div className="pos-order-panel" style={{ width: '100%', border: 'none', boxShadow: 'none' }}>
                  <BulkNotifyPanel onToast={(type, title, msg) => alert(`${title}: ${msg}`)} />
                </div>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <h3 style={{ marginTop: 0 }}>Recent Campaigns</h3>
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', background: '#F9FAFB', borderRadius: '8px' }}>
                No recent campaigns.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'segments' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Customer Segments</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Target specific groups of customers for higher conversion rates.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {['High Value Customers', 'Inactive (30+ days)', 'Newsletter Subscribers', 'VIP Members'].map(seg => (
                <div key={seg} style={{ padding: '1.5rem', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{seg}</h4>
                  <span style={{ fontSize: '12px', color: '#10B981', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>Ready</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'automations' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Automated Workflows</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Set up triggers to automatically engage customers.</p>
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', border: '2px dashed #E5E7EB', borderRadius: '8px', marginTop: '2rem' }}>
              <div style={{ fontSize: '32px', marginBottom: '1rem' }}>⚙️</div>
              <strong>Automations coming soon!</strong>
              <div style={{ fontSize: '13px', marginTop: '0.5rem' }}>Features like Abandoned Cart reminders and Birthday SMS will be available here.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

