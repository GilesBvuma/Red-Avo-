'use client';

import { useState, useCallback } from 'react';
import BulkNotifyPanel from './BulkNotifyPanel';
import { createOrder, fetchNotificationHistory } from '../lib/api';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: '💵' },
  { id: 'CARD', label: 'Card', icon: '💳' },
  { id: 'QR',   label: 'QR Code', icon: '📱' },
];

const TABS = ['Walk-in', 'Online', 'Bulk Notify'];

// Product placeholder colors (matches ProductCard)
const PRODUCT_COLORS = {
  'Tops':        '#8B0000',
  'Leggings':    '#1A237E',
  'Sports Bras': '#880E4F',
  'Jackets':     '#E91E63',
  'Sets':        '#4A148C',
  'Accessories': '#37474F',
};

let orderCounter = 1000;

export default function OrderPanel({ cart, onRemoveItem, onClearCart, onToast }) {
  const [activeTab,    setActiveTab]   = useState('Walk-in');
  const [payMethod,    setPayMethod]   = useState('CASH');
  const [customer,     setCustomer]    = useState({ name: '', email: '', phone: '' });
  const [completing,   setCompleting]  = useState(false);
  const [orderNum,     setOrderNum]    = useState('#RA-1001');
  const [notifHistory, setNotifHistory] = useState([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [panelWidth,   setPanelWidth]   = useState(340);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax      = subtotal * 0.15;
  const total    = subtotal + tax;

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchNotificationHistory();
      setNotifHistory(data.slice(0, 10)); // last 10
      setShowHistory(true);
    } catch {
      // ignore
    }
  }, []);

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      onToast('error', 'Empty Cart', 'Add items to the cart before completing a sale.');
      return;
    }

    setCompleting(true);

    try {
      const [firstName = '', ...rest] = (customer.name || 'Guest').split(' ');
      const lastName = rest.join(' ') || '';

      const orderPayload = {
        customerName:  customer.name  || 'Walk-in Customer',
        customerEmail: customer.email || null,
        customerPhone: customer.phone || null,
        paymentMethod: payMethod,
        subtotal,
        tax,
        total,
        items: cart.map((item) => ({
          productId:   item.product.id,
          variantId:   item.variant ? item.variant.id : null,
          productName: item.variant ? `${item.product.name} (${item.variant.size} - ${item.variant.color})` : item.product.name,
          quantity:    item.quantity,
          unitPrice:   item.product.price,
          lineTotal:   item.product.price * item.quantity,
        })),
        customer: {
          firstName,
          lastName,
          email:         customer.email || null,
          phoneNumber:   customer.phone || null,
          whatsappOptIn: false,
        },
      };

      const result = await createOrder(orderPayload);

      // Success
      const newNum = `#RA-${result.id || ++orderCounter}`;
      setOrderNum(newNum);

      onToast(
        'success',
        '🎉 Sale Completed!',
        `Order ${newNum} — $${total.toFixed(2)} via ${payMethod}`
      );

      if (customer.email || customer.phone) {
        onToast(
          'demo',
          '📲 Notification Sent',
          `DEMO: Thank-you message sent to ${customer.email || customer.phone}`
        );
      }

      // Clear cart and reset
      onClearCart();
      setCustomer({ name: '', email: '', phone: '' });
      setOrderNum(`#RA-${++orderCounter}`);
    } catch (err) {
      onToast('error', 'Sale Failed', err.message || 'Could not complete the sale. Check backend.');
    } finally {
      setCompleting(false);
    }
  };

  const thumbColor = (cat) => PRODUCT_COLORS[cat] || '#8B0000';

  // ── Drag-to-resize handler ──────────────────────────────────────
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (moveEvent) => {
      const delta    = startX - moveEvent.clientX; // drag left = wider
      const newWidth = Math.min(520, Math.max(260, startWidth + delta));
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor     = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  };

  return (
    <aside
      className="pos-order-panel"
      aria-label="Current order panel"
      style={{ width: panelWidth }}
    >
      {/* Drag-to-resize handle on left edge */}
      <div
        className="pos-resize-handle"
        onMouseDown={handleResizeMouseDown}
        title="Drag to resize panel"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="pos-order-header">
        <div className="pos-order-title-row">
          <h2 className="pos-order-title">Current Order</h2>
          <span className="pos-order-num" id="pos-order-number" aria-live="polite">{orderNum}</span>
        </div>

        {/* Tab row */}
        <div className="pos-order-tabs" role="tablist" aria-label="Order type">
          {TABS.map((tab) => (
            <button
              key={tab}
              id={`pos-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
              role="tab"
              aria-selected={activeTab === tab}
              className={`pos-order-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── BULK NOTIFY tab ── */}
      {activeTab === 'Bulk Notify' ? (
        <BulkNotifyPanel onToast={onToast} />
      ) : (
        <>
          {/* Scrollable body — items + totals + customer + payment */}
          <div className="pos-order-body">
            {/* Order items header */}
            {cart.length > 0 && (
              <div className="pos-order-items-header">
                <span className="pos-order-items-title">Items Selected</span>
                <span className="pos-order-items-count">{cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Order items */}
            <div className="pos-order-items" role="list" aria-label="Cart items">
              {cart.length === 0 ? (
                <div className="pos-empty-cart">
                  <div className="pos-empty-cart-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <div className="pos-empty-cart-text">No items yet<br/>Add products from the grid</div>
                </div>
              ) : (
                cart.map((item) => {
                  const itemKey = item.variant ? `v-${item.variant.id}` : `p-${item.product.id}`;
                  const displayName = item.variant ? `${item.product.name} (${item.variant.size} - ${item.variant.color})` : item.product.name;
                  return (
                  <div
                    key={itemKey}
                    className="pos-order-item"
                    role="listitem"
                    aria-label={`${displayName} × ${item.quantity}`}
                  >
                    <div
                      className="pos-order-item-thumb"
                      style={{ background: thumbColor(item.product.category) }}
                      aria-hidden="true"
                    >
                      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.2 }}>
                        {item.product.name.slice(0, 6)}
                      </span>
                    </div>
                    <div className="pos-order-item-info">
                      <div className="pos-order-item-name" style={{ fontSize: '13px' }}>{displayName}</div>
                      <div className="pos-order-item-qty">
                        {item.quantity} × ${item.product.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="pos-order-item-total">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      className="pos-order-item-remove"
                      onClick={() => onRemoveItem(itemKey)}
                      aria-label={`Remove ${displayName}`}
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                )})
              )}
            </div>

            {/* Totals */}
            <div className="pos-order-totals">
              <div className="pos-total-row">
                <span className="pos-total-label">Subtotal</span>
                <span className="pos-total-value">${subtotal.toFixed(2)}</span>
              </div>
              <div className="pos-total-row">
                <span className="pos-total-label">Tax (15%)</span>
                <span className="pos-total-value">${tax.toFixed(2)}</span>
              </div>
              <div className="pos-total-row main">
                <span className="pos-total-label" style={{ fontWeight: 700, color: 'var(--pos-text)' }}>Total</span>
                <span className="pos-total-value" id="pos-order-total">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer info */}
            <div className="pos-customer-section">
              <div className="pos-section-label">Customer Info</div>
              <input
                id="pos-customer-name"
                type="text"
                className="pos-input"
                placeholder="Full name"
                value={customer.name || ''}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                aria-label="Customer name"
              />
              <input
                id="pos-customer-email"
                type="email"
                className="pos-input"
                placeholder="Email address"
                value={customer.email || ''}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                aria-label="Customer email"
              />
              <input
                id="pos-customer-phone"
                type="tel"
                className="pos-input"
                placeholder="Phone / WhatsApp"
                value={customer.phone || ''}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                aria-label="Customer phone"
                style={{ marginBottom: 0 }}
              />
            </div>

            {/* Payment methods */}
            <div className="pos-payment-section">
              <div className="pos-section-label">Payment Method</div>
              <div className="pos-payment-methods" role="group" aria-label="Payment method selection">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    id={`pos-pay-${method.id.toLowerCase()}`}
                    className={`pos-payment-btn${payMethod === method.id ? ' active' : ''}`}
                    onClick={() => setPayMethod(method.id)}
                    aria-pressed={payMethod === method.id}
                  >
                    <span className="pos-payment-icon">{method.icon}</span>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification history toggle */}
            {!showHistory ? (
              <div style={{ textAlign: 'center', padding: '2px 16px 12px' }}>
                <button
                  style={{ fontSize: '11px', color: 'var(--pos-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={loadHistory}
                >
                  View notification history
                </button>
              </div>
            ) : (
              <div className="pos-notif-history visible" aria-label="Notification history">
                <div className="pos-notif-history-header">
                  Notification Log (DEMO)
                  <button
                    style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--pos-text-muted)' }}
                    onClick={() => setShowHistory(false)}
                  >
                    Hide
                  </button>
                </div>
                {notifHistory.length === 0 ? (
                  <div className="pos-notif-log-item" style={{ color: 'var(--pos-text-muted)', fontStyle: 'italic' }}>
                    No notifications sent yet
                  </div>
                ) : (
                  notifHistory.map((log) => (
                    <div key={log.id} className="pos-notif-log-item">
                      <span className={`pos-notif-type-tag ${log.type}`}>{log.type}</span>
                      <strong>{log.customerName}</strong> — {log.contact}
                      <div style={{ color: 'var(--pos-text-muted)', marginTop: '2px' }}>
                        {log.message?.slice(0, 60)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Complete Sale — pinned to bottom, never scrolls away */}
          <div className="pos-order-footer">
            <button
              id="pos-complete-sale-btn"
              className={`pos-complete-btn${completing ? ' loading' : ''}`}
              onClick={handleCompleteSale}
              disabled={completing || cart.length === 0}
              aria-busy={completing}
            >
              {completing ? (
                <>
                  <span className="pos-spinner" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  ✓ Complete Sale — ${total.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
