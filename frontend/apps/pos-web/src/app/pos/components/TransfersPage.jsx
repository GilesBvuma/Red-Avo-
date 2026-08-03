'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import { useAuth } from '../../AuthProvider';
import Pagination from './Pagination';

export default function TransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]); // Needed to look up variants
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // Filters: ALL, REQUESTED, DISPATCHED, RECEIVED, etc.
  const [currentPage, setCurrentPage] = useState(1);
  
  const [modal, setModal] = useState(null); // 'new', 'receive', 'resolve'
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [stockLevels, setStockLevels] = useState([]);

  // New transfer form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  
  // Object mapping variantId -> quantity to transfer
  const [transferQuantities, setTransferQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Receive/Resolve form state
  const [actionQuantity, setActionQuantity] = useState('');
  const [resolution, setResolution] = useState('WRITE_OFF');

  const loadData = useCallback(async () => {
    try {
      const [tRes, sRes, pRes, slRes] = await Promise.all([
        api.fetchTransfers(),
        api.fetchStores(),
        api.fetchProducts(),
        api.fetchStockLevels()
      ]);
      setTransfers(tRes);
      setStores(sRes);
      setProducts(pRes);
      setStockLevels(slRes);

      // Auto-set source store from the logged-in user's assigned store
      if (user?.storeId) {
        setFromStoreId(String(user.storeId));
      }
    } catch (e) {
      console.error('Failed to load transfer data', e);
    } finally {
      setLoading(false);
    }
  }, [user?.storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    const resolvedFromStoreId = user?.role !== 'ADMIN' ? String(user?.storeId) : fromStoreId;
    
    // Get variants that have a quantity > 0 set
    const variantsToTransfer = Object.entries(transferQuantities)
      .filter(([vId, qty]) => parseInt(qty) > 0)
      .map(([vId, qty]) => ({ variantId: parseInt(vId), quantity: parseInt(qty) }));
      
    if (variantsToTransfer.length === 0) {
      alert("Please specify a quantity greater than 0 for at least one variant.");
      return;
    }
    
    if (!resolvedFromStoreId || !toStoreId) return;
    
    try {
      setSubmitting(true);
      
      // Dispatch multiple requests concurrently
      await Promise.all(variantsToTransfer.map(t => 
        api.requestTransfer({
          variantId: t.variantId,
          fromStoreId: parseInt(resolvedFromStoreId),
          toStoreId: parseInt(toStoreId),
          quantity: t.quantity
        })
      ));
      
      setModal(null);
      setSelectedProductId('');
      setTransferQuantities({});
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit one or more transfers.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (id, dispatchQuantity) => {
    try {
      await api.dispatchTransfer(id, dispatchQuantity);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    if (!actionQuantity) return;
    try {
      await api.receiveTransfer(selectedTransfer.id, parseInt(actionQuantity));
      setModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await api.resolveTransferVariance(selectedTransfer.id, resolution);
      setModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading transfers...</div>;
  }

  // Filter and sort newest on top
  const filteredTransfers = transfers
    .filter(t => statusFilter === 'ALL' || t.status === statusFilter)
    .sort((a, b) => b.id - a.id);

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F5F5F5' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>Stock Transfers</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>Manage stock movement between stores</p>
        </div>
        {modal !== 'new' && (
          <button
            onClick={() => { setModal('new'); setTransferQuantities({}); setSelectedProductId(''); }}
            style={{
              background: '#C0392B', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(192,57,43,0.3)'
            }}
          >
            Request Transfer
          </button>
        )}
      </div>

      {modal === 'new' ? (
        <div style={{ padding: '28px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8E8', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F0F0F0' }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Create Transfer Request</h3>
              <button onClick={() => setModal(null)} style={{ background: '#F3F4F6', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#4B5563', fontSize: 13 }}>Cancel</button>
            </div>
            <form onSubmit={handleRequestTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* 1. SOURCE STORE */}
                {user?.role === 'ADMIN' ? (
                  <div>
                    <label style={labelStyle}>Source Store (Request From)</label>
                    <select required value={fromStoreId} onChange={e => setFromStoreId(e.target.value)} style={inputStyle}>
                      <option value="">Select Source Store...</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={labelStyle}>Your Store (Source)</label>
                    <div style={{ ...inputStyle, background: '#F9FAFB', color: '#374151', display: 'flex', alignItems: 'center' }}>
                      🏪 {stores.find(s => s.id === user?.storeId)?.name || `Store #${user?.storeId}`}
                    </div>
                  </div>
                )}

                {/* 2. DESTINATION STORE */}
                <div>
                  <label style={labelStyle}>Destination Store (Send To)</label>
                  <select required value={toStoreId} onChange={e => setToStoreId(e.target.value)} style={inputStyle}>
                    <option value="">Select Destination Store...</option>
                    {stores
                      .filter(s => user?.role === 'ADMIN' || s.id !== user?.storeId)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* 3. PRODUCT SELECTION */}
              <div>
                <label style={labelStyle}>Product</label>
                <select required value={selectedProductId} onChange={e => {
                  setSelectedProductId(e.target.value);
                  setTransferQuantities({});
                }} style={inputStyle}>
                  <option value="">Select a product...</option>
                  {products.map(p => 
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  )}
                </select>
              </div>
              
              {/* 4. VARIANTS GRID */}
              {selectedProductId && (
                <div>
                  <label style={labelStyle}>Select Variants to Transfer</label>
                  <p style={{fontSize: 12, color: '#6B7280', margin: '0 0 12px'}}>Check the variants you want to transfer and enter the quantity. Only variants currently in stock at the source store are available.</p>
                  <div style={{ border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                      <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E8E8E8' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', color: '#4B5563', width: '40px' }}></th>
                          <th style={{ padding: '12px 16px', color: '#4B5563' }}>Variant</th>
                          <th style={{ padding: '12px 16px', color: '#4B5563', textAlign: 'center' }}>Available</th>
                          <th style={{ padding: '12px 16px', color: '#4B5563', width: '120px' }}>Transfer Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.find(p => p.id === parseInt(selectedProductId))?.variants?.map(v => {
                          const resolvedFromStoreId = user?.role !== 'ADMIN' ? String(user?.storeId) : fromStoreId;
                          const availableStock = stockLevels.find(
                            sl => sl.variant?.id === v.id && sl.storeId === parseInt(resolvedFromStoreId)
                          )?.quantity || 0;
                          
                          const isChecked = transferQuantities[v.id] !== undefined;
                          
                          return (
                            <tr key={v.id} style={{ borderBottom: '1px solid #F3F4F6', opacity: availableStock > 0 ? 1 : 0.5, background: isChecked ? '#F0FDF4' : 'transparent', transition: 'background 0.2s' }}>
                              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <input 
                                  type="checkbox" 
                                  disabled={availableStock <= 0}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTransferQuantities(prev => ({...prev, [v.id]: 1}));
                                    } else {
                                      setTransferQuantities(prev => {
                                        const next = {...prev};
                                        delete next[v.id];
                                        return next;
                                      });
                                    }
                                  }}
                                  style={{ accentColor: '#C0392B', cursor: availableStock > 0 ? 'pointer' : 'not-allowed', width: 16, height: 16 }}
                                />
                              </td>
                              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                <div style={{ fontWeight: 500, color: '#111827' }}>{v.color || 'Default'} - {v.size || 'Default'}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>SKU: {v.sku}</div>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, color: availableStock > 0 ? '#059669' : '#9CA3AF' }}>
                                {availableStock}
                              </td>
                              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                {isChecked && (
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max={availableStock} 
                                    value={transferQuantities[v.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? '' : Math.min(parseInt(e.target.value) || 0, availableStock);
                                      setTransferQuantities(prev => ({...prev, [v.id]: val}));
                                    }}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, boxSizing: 'border-box', outline: 'none' }}
                                    onFocus={e => e.target.style.borderColor = '#C0392B'}
                                    onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={submitting} style={{...primaryBtnStyle, opacity: submitting ? 0.7 : 1, padding: '14px 28px', fontSize: 14}}>
                  {submitting ? 'Submitting...' : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ padding: '28px' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {['ALL', 'REQUESTED', 'DISPATCHED', 'RECEIVED', 'RESOLVED', 'CANCELLED'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid ' + (statusFilter === s ? '#111827' : '#E8E8E8'),
                  background: statusFilter === s ? '#111827' : '#fff',
                  color: statusFilter === s ? '#fff' : '#4B5563',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
            {filteredTransfers.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>No transfers found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9F9F9', borderBottom: '1px solid #E8E8E8' }}>
                  <th style={{ padding: '12px', fontWeight: 700 }}>ID</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Variant</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>From → To</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Qty</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.slice((currentPage - 1) * 20, currentPage * 20).map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                      <td style={{ padding: '12px' }}>TX-{t.id}</td>
                      <td style={{ padding: '12px' }}>{t.variant.sku}</td>
                      <td style={{ padding: '12px' }}>{t.fromStore.name} → {t.toStore.name}</td>
                      <td style={{ padding: '12px' }}>
                        Req: {t.requestedQuantity}<br/>
                        {t.dispatchedQuantity != null && `Sent: ${t.dispatchedQuantity}`}<br/>
                        {t.receivedQuantity != null && `Recv: ${t.receivedQuantity}`}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: t.status === 'RESOLVED' || t.status === 'RECEIVED' ? '#DEF7EC' : '#FEF3C7',
                          color: t.status === 'RESOLVED' || t.status === 'RECEIVED' ? '#03543F' : '#92400E'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {t.status === 'REQUESTED' && (user?.role === 'ADMIN' || user?.storeId === t.fromStore.id) && (
                          <button onClick={() => handleDispatch(t.id, t.requestedQuantity)} style={actionBtnStyle}>Dispatch</button>
                        )}
                        {t.status === 'DISPATCHED' && (user?.role === 'ADMIN' || user?.storeId === t.toStore.id) && (
                          <button onClick={() => { setSelectedTransfer(t); setModal('receive'); }} style={actionBtnStyle}>Receive</button>
                        )}
                        {t.status === 'VARIANCE_PENDING' && user?.role === 'ADMIN' && (
                          <button onClick={() => { setSelectedTransfer(t); setModal('resolve'); }} style={actionBtnStyle}>Resolve</button>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredTransfers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredTransfers.length / 20)}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
      )}

      {/* Modals for Receive / Resolve */}
      {(modal === 'receive' || modal === 'resolve') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                {modal === 'receive' ? 'Receive Transfer' : 'Resolve Variance'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            {modal === 'receive' && (
              <form onSubmit={handleReceive} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Quantity Received (Expected: {selectedTransfer.dispatchedQuantity})</label>
                  <input type="number" min="0" required value={actionQuantity} onChange={e => setActionQuantity(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={primaryBtnStyle}>Confirm Receipt</button>
              </form>
            )}

            {modal === 'resolve' && (
              <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: '#4B5563', margin: 0 }}>
                  Missing Quantity: {selectedTransfer.dispatchedQuantity - selectedTransfer.receivedQuantity}
                </p>
                <div>
                  <label style={labelStyle}>Resolution</label>
                  <select required value={resolution} onChange={e => setResolution(e.target.value)} style={inputStyle}>
                    <option value="WRITE_OFF">Write Off (Lost/Damaged)</option>
                    <option value="RETURN">Return to Source Store (Never Sent)</option>
                  </select>
                </div>
                <button type="submit" style={primaryBtnStyle}>Resolve</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  padding: '6px 12px', borderRadius: 6, border: '1px solid #E8E8E8', background: '#fff', fontSize: 12, cursor: 'pointer'
};
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 };
const inputStyle = { width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' };
const primaryBtnStyle = { padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
