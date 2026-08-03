'use client';

import { useState, useEffect } from 'react';
import { fetchOrders } from '../lib/api';

export default function ActiveOrdersBar() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const allOrders = await fetchOrders();
        const activeOnlineOrders = (allOrders || [])
          .filter(o => o.source === 'ONLINE' && ['PENDING_PAYMENT', 'CONFIRMED', 'DISPATCHED'].includes(o.status))
          .map(o => {
            const itemsCount = (o.items || []).reduce((sum, item) => sum + item.quantity, 0);
            let displayStatus = 'Processing';
            if (o.status === 'PENDING_PAYMENT') displayStatus = 'Pending';
            if (o.status === 'DISPATCHED') displayStatus = 'Ready';
            
            return {
              id: o.id.toString().padStart(3, '0'),
              customer: o.customerName || 'Walk-in',
              items: itemsCount,
              status: displayStatus,
              rawStatus: o.status
            };
          });
        setActiveOrders(activeOnlineOrders);
      } catch (err) {
        console.error('Failed to fetch active orders', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
    // Refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="pos-active-bar" role="complementary" aria-label="Active orders">
        <div className="pos-active-bar-label">Active</div>
        <div style={{ padding: '10px 20px', color: '#6B7280', fontSize: '13px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="pos-active-bar" role="complementary" aria-label="Active orders">
      <div className="pos-active-bar-label">Active</div>
      <div className="pos-active-orders">
        {activeOrders.length === 0 && (
          <div style={{ padding: '10px 20px', color: '#9CA3AF', fontSize: '13px' }}>No active online orders</div>
        )}
        {activeOrders.map((order) => (
          <div
            key={order.id}
            className="pos-order-tile"
            id={`pos-active-order-${order.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Order ${order.id} for ${order.customer} — ${order.status}`}
          >
            <div className="pos-order-num-badge" aria-hidden="true">#{order.id}</div>
            <div className="pos-order-tile-info">
              <div className="pos-order-tile-name">{order.customer}</div>
              <div className="pos-order-tile-meta">
                {order.items} item{order.items !== 1 ? 's' : ''}
                <span
                  className={`pos-order-status-badge ${order.status.toLowerCase()}`}
                  aria-label={`Status: ${order.status}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
