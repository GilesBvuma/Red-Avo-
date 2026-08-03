'use client';

import { useState, useCallback } from 'react';
import { sendBulkNotification, fetchCustomers } from '../lib/api';

const SEGMENTS = [
  { value: 'ALL_CUSTOMERS',         label: 'All Customers' },
  { value: 'WHATSAPP_OPTIN',        label: 'WhatsApp Opt-in Customers' },
  { value: 'LAST_30_DAYS',          label: 'Customers from Last 30 Days' },
  { value: 'THREE_PLUS_PURCHASES',  label: 'Customers with 3+ Purchases' },
];

const MSG_TYPES = ['Email', 'WhatsApp', 'SMS'];

const DEFAULT_TEMPLATE =
  `Hi [FirstName]! 🥑 New arrivals just dropped at Red Avo!\nCheck out our latest collection. Use code REDAVO10 for 10% off.\nShop now: www.redavo.com`;

export default function BulkNotifyPanel({ onToast }) {
  const [segment,     setSegment]     = useState('ALL_CUSTOMERS');
  const [msgType,     setMsgType]     = useState('Email');
  const [template,    setTemplate]    = useState(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [sending,     setSending]     = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [results,     setResults]     = useState(null);
  const [custCount,   setCustCount]   = useState(null);

  // Fetch customer count for selected segment (approximate via all customers)
  const refreshCount = useCallback(async () => {
    try {
      const customers = await fetchCustomers();
      const now = new Date();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      let count = customers.length;
      if (segment === 'WHATSAPP_OPTIN') {
        count = customers.filter((c) => c.whatsappOptIn).length;
      } else if (segment === 'LAST_30_DAYS') {
        count = customers.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo).length;
      } else if (segment === 'THREE_PLUS_PURCHASES') {
        count = customers.filter((c) => c.totalPurchases >= 3).length;
      }
      setCustCount(count);
    } catch {
      setCustCount(null);
    }
  }, [segment]);

  const handleSend = async () => {
    if (!template.trim()) {
      onToast('error', 'Missing Message', 'Please enter a message template.');
      return;
    }

    setSending(true);
    setProgress(10);
    setResults(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 300);

      const data = await sendBulkNotification({
        segment,
        type: msgType.toUpperCase(),
        message: template,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setResults(data);

      onToast(
        'success',
        'Bulk Notification Sent',
        `✅ ${data.sent} sent · ${data.failed} failed · ${data.total} total`
      );
    } catch (err) {
      setProgress(0);
      onToast('error', 'Send Failed', err.message || 'Could not send bulk notification.');
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const previewText = template.replace(/\[FirstName\]/g, 'Tanya');

  return (
    <div className="pos-bulk-panel">
      {/* Segment */}
      <div className="pos-bulk-group">
        <div className="pos-bulk-group-label">Customer Segment</div>
        <select
          id="pos-bulk-segment"
          className="pos-select"
          value={segment}
          onChange={(e) => { setSegment(e.target.value); setCustCount(null); }}
          aria-label="Select customer segment"
        >
          {SEGMENTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Message type */}
      <div className="pos-bulk-group">
        <div className="pos-bulk-group-label">Message Type</div>
        <div className="pos-msg-type-toggle" role="group" aria-label="Message type">
          {MSG_TYPES.map((t) => (
            <button
              key={t}
              id={`pos-msgtype-${t.toLowerCase()}`}
              className={`pos-msg-type-btn${msgType === t ? ' active' : ''}`}
              onClick={() => setMsgType(t)}
              aria-pressed={msgType === t}
            >
              {t === 'Email' ? '📧' : t === 'WhatsApp' ? '💬' : '📱'} {t}
            </button>
          ))}
        </div>
      </div>

      {/* Template */}
      <div className="pos-bulk-group">
        <div className="pos-bulk-group-label">Message Template</div>
        <textarea
          id="pos-bulk-template"
          className="pos-textarea"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Hi [FirstName]! ..."
          aria-label="Message template"
        />
        <div style={{ fontSize: '10px', color: 'var(--pos-text-light)', marginTop: '4px' }}>
          Use <code style={{ background: 'rgba(192,57,43,0.08)', padding: '1px 4px', borderRadius: '3px', color: 'var(--pos-red)' }}>[FirstName]</code> for personalisation
        </div>
      </div>

      {/* Preview */}
      <div className="pos-bulk-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div className="pos-bulk-group-label" style={{ marginBottom: 0 }}>Preview</div>
          <button
            id="pos-bulk-preview-btn"
            style={{ fontSize: '11px', color: 'var(--pos-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? 'Hide' : 'Show'}
          </button>
        </div>
        {showPreview && (
          <div className="pos-preview-box" aria-live="polite">{previewText}</div>
        )}
      </div>

      {/* Progress */}
      {(sending || progress > 0) && (
        <div className="pos-bulk-group">
          <div className="pos-progress-wrap">
            <div className="pos-progress-bar" style={{ width: `${progress}%` }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--pos-text-muted)', marginTop: '4px', textAlign: 'right' }}>
            {sending ? 'Sending...' : 'Complete'}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="pos-bulk-results" role="status" aria-live="polite">
          <div className="pos-result-chip sent">✅ {results.sent} Sent</div>
          <div className="pos-result-chip failed">❌ {results.failed} Failed</div>
          <div className="pos-result-chip total">📊 {results.total} Total</div>
        </div>
      )}

      {/* Customer count fetch */}
      {custCount === null ? (
        <button
          style={{ width: '100%', fontSize: '11px', color: 'var(--pos-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: '8px', padding: '4px 0' }}
          onClick={refreshCount}
        >
          Check customer count for this segment
        </button>
      ) : (
        <div style={{ fontSize: '11.5px', color: 'var(--pos-text-muted)', marginBottom: '8px', textAlign: 'center' }}>
          <strong style={{ color: 'var(--pos-red)' }}>{custCount}</strong> customers in this segment
        </div>
      )}

      {/* Send button */}
      <button
        id="pos-bulk-send-btn"
        className="pos-send-btn"
        onClick={handleSend}
        disabled={sending || !template.trim()}
        aria-busy={sending}
      >
        {sending ? (
          <>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pos-spin 0.7s linear infinite', marginRight: '6px', verticalAlign: 'middle' }} />
            Sending...
          </>
        ) : (
          `📤 Send to ${custCount !== null ? custCount : 'All'} Customers`
        )}
      </button>
    </div>
  );
}
