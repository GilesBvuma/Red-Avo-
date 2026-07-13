'use client';

import { useState, useEffect } from 'react';
import { fetchChannelStatus } from '../lib/api';

const CHANNEL_META = {
  email:    { label: 'Email',     icon: '📧' },
  whatsapp: { label: 'WhatsApp',  icon: '💬' },
  sms:      { label: 'SMS',       icon: '📱' },
};

export default function ChannelStatusBar() {
  const [channels, setChannels] = useState(null);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    fetchChannelStatus()
      .then(setChannels)
      .catch(() => setChannels(null));
  }, []);

  if (!channels) return null;

  const anyDemo = Object.values(channels).includes('DEMO');

  return (
    <div className="pos-channel-bar" style={{
      background: anyDemo ? 'rgba(217,119,6,0.06)' : 'rgba(22,163,74,0.06)',
      borderBottom: '1px solid var(--pos-border)',
      padding: '5px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      fontSize: '11.5px',
      flexShrink: 0,
    }}>
      <span style={{ fontWeight: 700, color: 'var(--pos-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>
        Channels
      </span>

      {Object.entries(channels).map(([key, status]) => {
        const meta   = CHANNEL_META[key] || { label: key, icon: '🔔' };
        const isLive = status === 'LIVE';
        return (
          <div
            key={key}
            id={`pos-channel-${key}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 10px',
              borderRadius: '999px',
              background: isLive ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.12)',
              color: isLive ? '#15803D' : '#B45309',
              fontWeight: 600,
            }}
            title={isLive ? `${meta.label} sending is LIVE` : `${meta.label} is in DEMO mode — messages are logged only`}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: isLive ? '#16A34A' : '#D97706',
              display: 'inline-block',
              animation: isLive ? 'none' : 'pos-pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '9.5px', opacity: 0.8 }}>{status}</span>
          </div>
        );
      })}

      {anyDemo && (
        <span
          style={{ marginLeft: 'auto', color: 'var(--pos-text-muted)', fontSize: '10.5px', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setOpen(v => !v)}
        >
          {open ? 'Hide setup guide' : 'How to go live →'}
        </span>
      )}

      {open && (
        <div style={{
          position: 'fixed', top: 80, right: 20, zIndex: 200,
          background: '#1A1A1A', color: '#fff', borderRadius: '12px',
          padding: '16px', maxWidth: '320px', fontSize: '12px', lineHeight: 1.6,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontWeight: 800, marginBottom: '10px', fontSize: '13px' }}>📡 Go Live Checklist</div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: channels.email === 'LIVE' ? '#4ADE80' : '#FCD34D', fontWeight: 700 }}>
              {channels.email === 'LIVE' ? '✅' : '⏳'} Email (Gmail)
            </div>
            <div style={{ opacity: 0.75, fontSize: '11px' }}>
              Set <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px' }}>notification.demo.mode=false</code> in application.properties
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: channels.whatsapp === 'LIVE' ? '#4ADE80' : '#FCD34D', fontWeight: 700 }}>
              {channels.whatsapp === 'LIVE' ? '✅' : '⏳'} WhatsApp (Meta Cloud API)
            </div>
            <div style={{ opacity: 0.75, fontSize: '11px' }}>
              1. Go to <strong>developers.facebook.com</strong><br/>
              2. Create App → Business → Add WhatsApp product<br/>
              3. Copy <strong>Phone Number ID</strong> + <strong>Access Token</strong><br/>
              4. Add to <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px' }}>backend/.env</code> → restart
            </div>
          </div>

          <div>
            <div style={{ color: channels.sms === 'LIVE' ? '#4ADE80' : '#FCD34D', fontWeight: 700 }}>
              {channels.sms === 'LIVE' ? '✅' : '⏳'} SMS (Twilio)
            </div>
            <div style={{ opacity: 0.75, fontSize: '11px' }}>Same Twilio account covers SMS automatically</div>
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{ marginTop: '12px', width: '100%', padding: '7px', background: 'var(--pos-red)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
