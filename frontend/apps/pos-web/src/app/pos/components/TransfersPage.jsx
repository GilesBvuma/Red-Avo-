'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import { useAuth } from '../../AuthProvider';

export default function TransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]); // Needed to look up variants
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState(null); // 'new', 'receive', 'resolve'
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // New transfer form state
  const [variantId, setVariantId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [quantity, setQuantity] = useState('');

  // Receive/Resolve form state
  const [actionQuantity, setActionQuantity] = useState('');
  const [resolution, setResolution] = useState('WRITE_OFF');

  const loadData = useCallback(async () => {
    try {
      const [tRes, sRes, pRes] = await Promise.all([
        api.fetchTransfers(),
        api.fetchStores(),
        api.fetchProducts()
      ]);
      setTransfers(tRes);
      setStores(sRes);
      setProducts(pRes);
    } catch (e) {
      console.error('Failed to load transfer data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!variantId || !toStoreId || !quantity) return;
    try {
      await api.requestTransfer({
        variantId: parseInt(variantId),
        fromStoreId: user.storeId || stores[0]?.id, // Default logic for admin
        toStoreId: parseInt(toStoreId),
        quantity: parseInt(quantity)
      });
      setModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
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

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F5F5F5' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>Stock Transfers</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>Manage stock movement between stores</p>
        </div>
        <button
          onClick={() => setModal('new')}
          style={{
            background: '#C0392B', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 20px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(192,57,43,0.3)'
          }}
        >
          Request Transfer
        </button>
      </div>

      <div style={{ padding: '28px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
          {transfers.length === 0 ? (
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
                {transfers.map(t => (
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
                      {t.status === 'REQUESTED' && (user.role === 'ADMIN' || user.storeId === t.fromStore.id) && (
                        <button onClick={() => handleDispatch(t.id, t.requestedQuantity)} style={actionBtnStyle}>Dispatch</button>
                      )}
                      {t.status === 'DISPATCHED' && (user.role === 'ADMIN' || user.storeId === t.toStore.id) && (
                        <button onClick={() => { setSelectedTransfer(t); setModal('receive'); }} style={actionBtnStyle}>Receive</button>
                      )}
                      {t.status === 'VARIANCE_PENDING' && user.role === 'ADMIN' && (
                        <button onClick={() => { setSelectedTransfer(t); setModal('resolve'); }} style={actionBtnStyle}>Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                {modal === 'new' ? 'Request Transfer' : modal === 'receive' ? 'Receive Transfer' : 'Resolve Variance'}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            {modal === 'new' && (
              <form onSubmit={handleRequestTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Variant SKU</label>
                  <input type="number" placeholder="Variant ID (Temp)" required value={variantId} onChange={e => setVariantId(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>To Store</label>
                  <select required value={toStoreId} onChange={e => setToStoreId(e.target.value)} style={inputStyle}>
                    <option value="">Select Store...</option>
                    {stores.filter(s => s.id !== user.storeId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantity</label>
                  <input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={primaryBtnStyle}>Submit Request</button>
              </form>
            )}

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
