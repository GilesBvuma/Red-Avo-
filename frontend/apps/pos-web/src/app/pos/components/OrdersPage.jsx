'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import Pagination from './Pagination';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('POS'); // 'POS' or 'ONLINE'
  const [currentPage, setCurrentPage] = useState(1);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.fetchOrders();
      // Assume the backend returns an array of orders, sort by date descending
      const sorted = res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFulfil = async (id, action) => {
    try {
      await api.fulfilOrder(id, action);
      loadOrders(); // Refresh to show new status
    } catch (err) {
      setError('Failed to fulfil order: ' + err.message);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F5F5F5' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>Orders History</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>View and manage customer orders</p>
        </div>
        <button
          onClick={loadOrders}
          style={{
            background: '#F9FAFB', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', color: '#374151'
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ padding: '0 28px', marginTop: '24px', display: 'flex', gap: '16px', borderBottom: '1px solid #E8E8E8' }}>
        <button 
          onClick={() => { setActiveTab('POS'); setCurrentPage(1); }}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px',
            fontSize: '14px', fontWeight: activeTab === 'POS' ? 700 : 500,
            color: activeTab === 'POS' ? '#C0392B' : '#6B7280',
            borderBottom: activeTab === 'POS' ? '2px solid #C0392B' : '2px solid transparent'
          }}
        >
          POS Orders
        </button>
        <button 
          onClick={() => { setActiveTab('ONLINE'); setCurrentPage(1); }}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px',
            fontSize: '14px', fontWeight: activeTab === 'ONLINE' ? 700 : 500,
            color: activeTab === 'ONLINE' ? '#C0392B' : '#6B7280',
            borderBottom: activeTab === 'ONLINE' ? '2px solid #C0392B' : '2px solid transparent'
          }}
        >
          Online Orders
        </button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {error && <div style={{ color: '#e53e3e', marginBottom: '16px' }}>{error}</div>}

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>Loading orders...</div>
          ) : (() => {
            const filteredOrders = orders.filter(o => o.source === activeTab);
            return filteredOrders.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>No orders found.</div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9F9F9', borderBottom: '1px solid #E8E8E8' }}>
                  <th style={thStyle}>Order Ref</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Status</th>
                  {activeTab === 'ONLINE' && <th style={thStyle}>Delivery</th>}
                  <th style={thStyle}>Total ($)</th>
                  <th style={thStyle}>Items</th>
                  {activeTab === 'ONLINE' && <th style={thStyle}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice((currentPage - 1) * 20, currentPage * 20).map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                    <td style={tdStyle}><strong>{o.orderReference}</strong></td>
                    <td style={tdStyle}>{new Date(o.createdAt).toLocaleString()}</td>
                    <td style={tdStyle}>{o.customerName || (o.customer ? o.customer.name : 'Walk-in')}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        background: o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'COLLECTED' ? '#D1FAE5' : 
                                    o.status === 'CONFIRMED' ? '#FEF3C7' :
                                    o.status === 'PROCESSING' ? '#DBEAFE' :
                                    o.status === 'DISPATCHED' || o.status === 'READY_FOR_COLLECTION' ? '#E0E7FF' : '#FEE2E2',
                        color: o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'COLLECTED' ? '#065F46' : 
                               o.status === 'CONFIRMED' ? '#92400E' :
                               o.status === 'PROCESSING' ? '#1E40AF' :
                               o.status === 'DISPATCHED' || o.status === 'READY_FOR_COLLECTION' ? '#3730A3' : '#991B1B',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 
                      }}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {activeTab === 'ONLINE' && (
                      <td style={tdStyle}>
                        {o.deliveryMethod}
                        <div style={{ fontSize: '11px', color: '#6B7280', maxWidth: '150px' }}>{o.deliveryAddress}</div>
                      </td>
                    )}
                    <td style={tdStyle}>${(o.total || 0).toFixed(2)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {o.items?.map(i => (
                          <span key={i.id} style={{ fontSize: '11px', color: '#4B5563' }}>
                            {i.quantity}x {i.productName} (${(i.unitPrice || 0).toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </td>
                    {activeTab === 'ONLINE' && (
                      <td style={tdStyle}>
                        {o.status === 'CONFIRMED' && (
                          <button 
                            onClick={() => handleFulfil(o.id, 'PROCESSING')}
                            style={{ 
                              background: '#F59E0B', color: '#fff', border: 'none', 
                              padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' 
                            }}
                          >
                            Start Packing
                          </button>
                        )}
                        {o.status === 'PROCESSING' && (
                          <button 
                            onClick={() => handleFulfil(o.id, o.deliveryMethod === 'DELIVERY' ? 'DISPATCHED' : 'READY_FOR_COLLECTION')}
                            style={{ 
                              background: '#3B82F6', color: '#fff', border: 'none', 
                              padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' 
                            }}
                          >
                            {o.deliveryMethod === 'DELIVERY' ? 'Dispatch' : 'Ready for Collection'}
                          </button>
                        )}
                        {(o.status === 'DISPATCHED' || o.status === 'READY_FOR_COLLECTION') && (
                          <button 
                            onClick={() => handleFulfil(o.id, 'COMPLETED')}
                            style={{ 
                              background: '#10B981', color: '#fff', border: 'none', 
                              padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' 
                            }}
                          >
                            {o.deliveryMethod === 'DELIVERY' ? 'Mark Delivered' : 'Mark Collected'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredOrders.length / 20)}
                onPageChange={setCurrentPage}
              />
            )}
            </>
          );
          })()}
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px 16px', fontWeight: 700, color: '#374151' };
const tdStyle = { padding: '12px 16px', color: '#1F2937' };
