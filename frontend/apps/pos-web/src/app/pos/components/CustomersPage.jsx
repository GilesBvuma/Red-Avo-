'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer, sendBulkEmail } from '../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phoneNumber: '',
  address: '', notes: '', whatsappOptIn: false, isActive: true,
};

const SEGMENTS = [
  { value: 'ALL',                label: 'All Customers',          icon: '👥' },
  { value: 'WHATSAPP_OPTIN',     label: 'WhatsApp Opted-in',      icon: '💬' },
  { value: 'THREE_PLUS_PURCHASES', label: '3+ Purchases (Loyal)', icon: '⭐' },
];

// ─── Add/Edit Customer Modal ─────────────────────────────────────────
function CustomerModal({ customer, onClose, onSaved }) {
  const isEdit = !!customer;
  const [form, setForm] = useState(isEdit ? { ...EMPTY_FORM, ...customer } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) { setError('First name is required'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await updateCustomer(customer.id, form);
      } else {
        const res = await createCustomer(form);
        // 409 conflict means duplicate email
        if (res && res.error) { setError(res.error); setSaving(false); return; }
      }
      onSaved();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('409') || msg.toLowerCase().includes('already exists')) {
        setError('A customer with this email already exists.');
      } else {
        setError(err.message || 'Failed to save customer');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding:'22px 28px 16px', borderBottom:'1px solid #F0F0F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#1A1A1A' }}>{isEdit ? 'Edit Customer' : 'Add Customer'}</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{isEdit ? 'Update contact details' : 'Add a customer to your database'}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'20px 28px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <Field label="First Name *">
              <Input placeholder="e.g. Tanya" value={form.firstName} onChange={v => set('firstName', v)} />
            </Field>
            <Field label="Last Name">
              <Input placeholder="e.g. Moyo" value={form.lastName} onChange={v => set('lastName', v)} />
            </Field>
            <Field label="Email">
              <Input type="email" placeholder="customer@email.com" value={form.email} onChange={v => set('email', v)} />
            </Field>
            <Field label="Phone Number">
              <Input placeholder="+263 77 123 4567" value={form.phoneNumber} onChange={v => set('phoneNumber', v)} />
            </Field>
            <Field label="Address" style={{ gridColumn:'1/-1' }}>
              <Input placeholder="Optional address..." value={form.address} onChange={v => set('address', v)} />
            </Field>
            <Field label="Staff Notes" style={{ gridColumn:'1/-1' }}>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any notes about this customer..."
                rows={2}
                style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #E8E8E8', borderRadius:8, fontSize:13, resize:'vertical', boxSizing:'border-box', background:'#FAFAFA' }}
              />
            </Field>
          </div>

          <div style={{ display:'flex', gap:16, marginBottom:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'#374151' }}>
              <input type="checkbox" checked={form.whatsappOptIn} onChange={e => set('whatsappOptIn', e.target.checked)}
                style={{ width:15, height:15, accentColor:'#C0392B' }} />
              WhatsApp Opt-in
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:'#374151' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                style={{ width:15, height:15, accentColor:'#C0392B' }} />
              Active customer
            </label>
          </div>

          {error && <div style={{ color:'#C0392B', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#FFF0EE', borderRadius:6 }}>{error}</div>}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'10px 22px', borderRadius:8, border:'1.5px solid #E8E8E8', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', color:'#6B7280' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding:'10px 28px', borderRadius:8, border:'none', background:saving ? '#e0b0b0' : '#C0392B', color:'#fff', fontSize:13, fontWeight:700, cursor:saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Bulk Email Modal ────────────────────────────────────────────────
function BulkEmailModal({ customers, onClose }) {
  const [segment,  setSegment]  = useState('ALL');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');

  // Preview count for selected segment
  const previewCount = {
    ALL:                   customers.length,
    WHATSAPP_OPTIN:        customers.filter(c => c.whatsappOptIn).length,
    THREE_PLUS_PURCHASES:  customers.filter(c => c.totalPurchases >= 3).length,
  }[segment] ?? 0;

  const handleSend = async () => {
    if (!subject.trim()) { setError('Subject is required'); return; }
    if (!message.trim()) { setError('Message is required'); return; }
    setSending(true); setError(''); setResult(null);
    try {
      const res = await sendBulkEmail({ segment, subject, message });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:580, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'22px 28px 16px', borderBottom:'1px solid #F0F0F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'#1A1A1A' }}>📧 Bulk Email Campaign</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>Compose and send to a customer segment</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding:'20px 28px 28px' }}>
          {/* Segment selector */}
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9CA3AF', display:'block', marginBottom:8 }}>
              Target Segment
            </label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {SEGMENTS.map(s => (
                <button key={s.value} type="button" onClick={() => setSegment(s.value)}
                  style={{
                    padding:'8px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                    border: segment === s.value ? '2px solid #C0392B' : '1.5px solid #E8E8E8',
                    background: segment === s.value ? '#C0392B' : '#fff',
                    color: segment === s.value ? '#fff' : '#374151',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop:8, fontSize:12, color:'#6B7280' }}>
              Will send to <strong style={{ color:'#C0392B' }}>{previewCount}</strong> customer{previewCount !== 1 ? 's' : ''} with a valid email address.
            </div>
          </div>

          {/* Subject */}
          <Field label="Email Subject *">
            <Input placeholder="e.g. New Arrivals at Red Avo 🥑" value={subject} onChange={v => setSubject(v)} />
          </Field>

          {/* Message */}
          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:12, fontWeight:500, color:'#374151', marginBottom:5, display:'block' }}>
              Message * <span style={{ fontWeight:400, color:'#9CA3AF' }}>(use [FirstName] for personalisation)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={"Hi [FirstName]! 🥑\n\nWe've just dropped new styles for you.\n\nShop the latest at redavo.co.zw\n\n— The Red Avo Team"}
              rows={8}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E8E8', borderRadius:8, fontSize:13, resize:'vertical', boxSizing:'border-box', background:'#FAFAFA', fontFamily:'inherit', lineHeight:1.6 }}
            />
          </div>

          {error && <div style={{ color:'#C0392B', fontSize:13, margin:'10px 0', padding:'8px 12px', background:'#FFF0EE', borderRadius:6 }}>{error}</div>}

          {/* Result */}
          {result && (
            <div style={{ margin:'14px 0', padding:'14px 16px', background:'#F0FDF4', borderRadius:10, border:'1px solid #BBF7D0' }}>
              <div style={{ fontWeight:700, color:'#166534', marginBottom:4 }}>✅ Campaign sent!</div>
              <div style={{ fontSize:13, color:'#166534' }}>
                {result.sent} sent · {result.failed} failed · {result.total} total recipients
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
            <button onClick={onClose}
              style={{ padding:'10px 22px', borderRadius:8, border:'1.5px solid #E8E8E8', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', color:'#6B7280' }}>
              Close
            </button>
            <button onClick={handleSend} disabled={sending || previewCount === 0}
              style={{ padding:'10px 28px', borderRadius:8, border:'none', background:sending || previewCount === 0 ? '#e0b0b0' : '#C0392B', color:'#fff', fontSize:13, fontWeight:700, cursor: sending || previewCount === 0 ? 'not-allowed' : 'pointer' }}>
              {sending ? 'Sending…' : `Send to ${previewCount} Customer${previewCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small form helpers ──────────────────────────────────────────────
function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={{ fontSize:12, fontWeight:500, color:'#374151', marginBottom:5, display:'block' }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ onChange, ...props }) {
  return (
    <input {...props}
      onChange={e => onChange(e.target.value)}
      style={{ width:'100%', height:36, padding:'0 12px', border:'1.5px solid #E8E8E8', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', background:'#FAFAFA' }}
      onFocus={e => e.target.style.borderColor = '#C0392B'}
      onBlur={e => e.target.style.borderColor = '#E8E8E8'}
    />
  );
}

// ─── Initials avatar ─────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?';
  const colors   = ['#C0392B','#8B0000','#1A1A1A','#374151','#0D9488','#1B3A6B'];
  const color    = colors[(initials.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width:36, height:36, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
      {initials}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null);   // null | 'new' | customer object
  const [bulkModal, setBulkModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    try { setCustomers(await fetchCustomers()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await deleteCustomer(id);
    setConfirmDelete(null);
    load();
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q
      || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
      || (c.email || '').toLowerCase().includes(q)
      || (c.phoneNumber || '').includes(q);
  });

  // Summary stats
  const totalCustomers = customers.length;
  const totalLifetime  = customers.reduce((s, c) => s + (c.lifetimeValue || 0), 0);
  const whatsappCount  = customers.filter(c => c.whatsappOptIn).length;
  const loyalCount     = customers.filter(c => c.totalPurchases >= 3).length;

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#F5F5F5' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E8E8E8', padding:'18px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, margin:0, color:'#1A1A1A' }}>Customers</h2>
          <p style={{ fontSize:12, color:'#9CA3AF', margin:'3px 0 0' }}>Manage your customer database</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>

          <button
            onClick={() => setModal('new')}
            style={{ display:'flex', alignItems:'center', gap:8, background:'#C0392B', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 12px rgba(192,57,43,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#8B0000'}
            onMouseLeave={e => e.currentTarget.style.background = '#C0392B'}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, padding:'18px 28px 0' }}>
        {[
          { label:'Total Customers',    value: totalCustomers,               icon:'👥', color:'#C0392B' },
          { label:'Total Lifetime Value',value:`$${totalLifetime.toFixed(2)}`,icon:'💰', color:'#1A1A1A' },
          { label:'WhatsApp Opted-in',  value: whatsappCount,                icon:'💬', color:'#0D9488' },
          { label:'Loyal (3+ orders)',   value: loyalCount,                   icon:'⭐', color:'#D97706' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', border:'1px solid #E8E8E8' }}>
            <div style={{ fontSize:20 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginTop:6 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding:'16px 28px' }}>
        <div style={{ position:'relative', maxWidth:340 }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            style={{ width:'100%', height:36, padding:'0 12px 0 36px', border:'1.5px solid #E8E8E8', borderRadius:8, fontSize:13, outline:'none', background:'#fff', boxSizing:'border-box' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ padding:'0 28px 28px' }}>
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E8E8E8', overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Loading customers…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:60, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>👤</div>
              <div style={{ fontWeight:600, color:'#374151', marginBottom:6 }}>No customers found</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>Add a customer or make a sale to get started.</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#F9F9F9', borderBottom:'1px solid #E8E8E8' }}>
                  {['Customer','Contact','Orders','Lifetime Value','Last Purchase','Joined','Actions'].map(h => (
                    <th key={h} style={{ padding:'11px 14px', fontWeight:700, fontSize:11, letterSpacing:'0.06em', color:'#6B7280', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
                  return (
                    <tr key={c.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0F0F0' : 'none', transition:'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF5'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      {/* Name */}
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={fullName} />
                          <div>
                            <div style={{ fontWeight:600, color:'#1A1A1A' }}>{fullName}</div>
                            {c.whatsappOptIn && <div style={{ fontSize:10, color:'#0D9488', fontWeight:600 }}>💬 WhatsApp OK</div>}
                            {!c.isActive && <div style={{ fontSize:10, color:'#9CA3AF' }}>Inactive</div>}
                          </div>
                        </div>
                      </td>
                      {/* Contact */}
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ color:'#374151' }}>{c.email || <span style={{ color:'#C9CACC' }}>—</span>}</div>
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>{c.phoneNumber || ''}</div>
                      </td>
                      {/* Orders */}
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontWeight:700, color:'#1A1A1A' }}>{c.totalPurchases || 0}</span>
                      </td>
                      {/* Lifetime value */}
                      <td style={{ padding:'12px 14px', fontWeight:700, color:'#C0392B' }}>
                        ${(c.lifetimeValue || 0).toFixed(2)}
                      </td>
                      {/* Last purchase */}
                      <td style={{ padding:'12px 14px', color:'#6B7280', fontSize:12 }}>
                        {c.lastPurchaseAt ? new Date(c.lastPurchaseAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      {/* Joined */}
                      <td style={{ padding:'12px 14px', color:'#9CA3AF', fontSize:12 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      {/* Actions */}
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => setModal(c)}
                            style={{ padding:'5px 12px', borderRadius:6, border:'1.5px solid #E8E8E8', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', color:'#374151', transition:'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#C0392B'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E8E8'}
                          >Edit</button>
                          <button onClick={() => setConfirmDelete(c.id)}
                            style={{ padding:'5px 10px', borderRadius:6, border:'1.5px solid #E8E8E8', background:'#fff', fontSize:12, cursor:'pointer', color:'#C0392B', transition:'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FFF0EE'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <CustomerModal
          customer={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {/* Bulk email modal */}
      {bulkModal && (
        <BulkEmailModal customers={customers} onClose={() => setBulkModal(false)} />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:14, padding:32, maxWidth:360, width:'100%', textAlign:'center', boxShadow:'0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#1A1A1A', marginBottom:8 }}>Remove this customer?</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:24 }}>Their order history will remain intact.</div>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding:'9px 22px', borderRadius:8, border:'1.5px solid #E8E8E8', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', color:'#374151' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{ padding:'9px 22px', borderRadius:8, border:'none', background:'#C0392B', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
