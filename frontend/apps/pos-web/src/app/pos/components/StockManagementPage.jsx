'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../lib/api';

// ─── Constants ──────────────────────────────────────────────────────
const SIZES_ALL  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS_ALL = [
  { name: 'Crimson Red',  hex: '#C0392B' },
  { name: 'Matte Black',  hex: '#1A1A1A' },
  { name: 'Soft White',   hex: '#FAFAF5' },
  { name: 'Blush Pink',   hex: '#F4A0A0' },
  { name: 'Forest Green', hex: '#2D6A4F' },
  { name: 'Navy Blue',    hex: '#1B3A6B' },
  { name: 'Stone Grey',   hex: '#9CA3AF' },
  { name: 'Caramel',      hex: '#C68642' },
  { name: 'Lavender',     hex: '#A78BFA' },
  { name: 'Teal',         hex: '#0D9488' },
];
const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Activewear', 'Accessories', 'Footwear', 'Sets', 'Other'];

// ─── Helpers ────────────────────────────────────────────────────────
const parseCsv  = (s) => (s ? s.split(',').map(x => x.trim()).filter(Boolean) : []);
const toBadgeClass = (status) => ({
  IN_STOCK:    'in-stock',
  LOW_STOCK:   'low-stock',
  OUT_OF_STOCK:'out-of-stock',
}[status] ?? 'out-of-stock');

const EMPTY_FORM = {
  name: '', category: '', sku: '', description: '',
  price: '', salePrice: '', onSale: false,
  stockQuantity: '', lowStockThreshold: '5',
  vatRate: '15', discount: '0',
  colors: [], sizes: [],
  imageUrl: '', isActive: true,
};

// ─── Color swatch picker ─────────────────────────────────────────────
function ColorPicker({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {COLORS_ALL.map(c => {
        const active = selected.includes(c.name);
        return (
          <button
            key={c.name}
            type="button"
            title={c.name}
            onClick={() => onChange(active ? selected.filter(n => n !== c.name) : [...selected, c.name])}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: c.hex, border: active ? '3px solid #C0392B' : '2px solid #e0e0e0',
              cursor: 'pointer', outline: active ? '2px solid white' : 'none',
              outlineOffset: -4, transition: 'all 0.15s', boxSizing: 'border-box',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Size pill picker ────────────────────────────────────────────────
function SizePicker({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {SIZES_ALL.map(s => {
        const active = selected.includes(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(active ? selected.filter(x => x !== s) : [...selected, s])}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: active ? '2px solid #C0392B' : '1.5px solid #E8E8E8',
              background: active ? '#C0392B' : '#fff',
              color: active ? '#fff' : '#6B7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ─── Image upload drop zone ──────────────────────────────────────────
function ImageDropZone({ preview, onFile }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      style={{
        width: '100%', height: 140, borderRadius: 10,
        border: `2px dashed ${dragging ? '#C0392B' : '#E8E8E8'}`,
        background: dragging ? 'rgba(192,57,43,0.05)' : '#FAFAFA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8, cursor: 'pointer',
        transition: 'all 0.2s', overflow: 'hidden', position: 'relative',
      }}
    >
      {preview ? (
        <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
      ) : (
        <>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>Click or drag photo here</span>
          <span style={{ fontSize: 11, color: '#C9CACC' }}>JPG, PNG, WEBP • max 10 MB</span>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

// ─── Modal form ──────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(isEdit ? {
    ...EMPTY_FORM,
    ...product,
    price: product.price ?? '',
    salePrice: product.salePrice ?? '',
    stockQuantity: product.stockQuantity ?? '',
    lowStockThreshold: product.lowStockThreshold ?? '5',
    vatRate: product.vatRate ?? '15',
    discount: product.discount ?? '0',
    colors: parseCsv(product.colors),
    sizes: parseCsv(product.sizes),
  } : { ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(isEdit ? product.imageUrl : null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFile = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (!form.price)        { setError('Price is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        price:             parseFloat(form.price) || 0,
        salePrice:         form.salePrice ? parseFloat(form.salePrice) : null,
        stockQuantity:     parseInt(form.stockQuantity) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        vatRate:           parseFloat(form.vatRate) || 15,
        discount:          parseInt(form.discount) || 0,
        colors:            form.colors.join(','),
        sizes:             form.sizes.join(','),
      };

      let saved;
      if (isEdit) {
        saved = await api.updateProduct(product.id, payload);
      } else {
        saved = await api.createProduct(payload);
      }

      // Upload image if selected
      if (imageFile && saved.id) {
        await api.uploadProductImage(saved.id, imageFile);
      }

      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>{isEdit ? 'Edit Listing' : 'Add New Listing'}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Fill in the product details below</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 28px' }}>
          {/* Product photo */}
          <Section label="Product Photo">
            <ImageDropZone preview={preview} onFile={handleFile} />
          </Section>

          {/* Basic info */}
          <Section label="Basic Info">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Product Name *" fullWidth>
                <Input placeholder="e.g. Core Training Leggings" value={form.name} onChange={v => set('name', v)} />
              </Field>
              <Field label="SKU / Code">
                <Input placeholder="e.g. RA-LGG-001" value={form.sku} onChange={v => set('sku', v)} />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={e => set('category', e.target.value)} style={selectStyle}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Description">
                <Input placeholder="Short description..." value={form.description} onChange={v => set('description', v)} />
              </Field>
            </div>
          </Section>

          {/* Pricing */}
          <Section label="Pricing & VAT">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="Retail Price (USD) *">
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={v => set('price', v)} />
              </Field>
              <Field label="VAT Rate (%)">
                <Input type="number" step="1" min="0" max="100" value={form.vatRate} onChange={v => set('vatRate', v)} />
              </Field>
              <Field label="Discount (%)">
                <Input type="number" step="1" min="0" max="100" value={form.discount} onChange={v => set('discount', v)} />
              </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={form.onSale} onChange={e => set('onSale', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#C0392B' }} />
                On Sale
              </label>
              {form.onSale && (
                <Field label="Sale Price (USD)" style={{ flex: 1 }}>
                  <Input type="number" step="0.01" min="0" placeholder="Sale price..." value={form.salePrice} onChange={v => set('salePrice', v)} />
                </Field>
              )}
            </div>
          </Section>

          {/* Stock */}
          <Section label="Inventory">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Stock Quantity">
                <Input type="number" min="0" placeholder="0" value={form.stockQuantity} onChange={v => set('stockQuantity', v)} />
              </Field>
              <Field label="Low-Stock Alert Threshold">
                <Input type="number" min="0" placeholder="5" value={form.lowStockThreshold} onChange={v => set('lowStockThreshold', v)} />
              </Field>
            </div>
          </Section>

          {/* Sizes */}
          <Section label="Available Sizes">
            <SizePicker selected={form.sizes} onChange={v => set('sizes', v)} />
            {form.sizes.length > 0 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                Selected: {form.sizes.join(', ')}
              </div>
            )}
          </Section>

          {/* Colors */}
          <Section label="Available Colors">
            <ColorPicker selected={form.colors} onChange={v => set('colors', v)} />
            {form.colors.length > 0 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                Selected: {form.colors.join(', ')}
              </div>
            )}
          </Section>

          {/* Visibility */}
          <Section label="Visibility">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#C0392B' }} />
              Listed (visible in POS menu)
            </label>
          </Section>

          {error && <div style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 22px', borderRadius: 8, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6B7280' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: saving ? '#e0b0b0' : '#C0392B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Small form helpers ──────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
function Field({ label, children, fullWidth }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5, display: 'block' }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ onChange, ...props }) {
  return (
    <input {...props}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', height: 36, padding: '0 12px', border: '1.5px solid #E8E8E8', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', background: '#FAFAFA' }}
      onFocus={e => e.target.style.borderColor = '#C0392B'}
      onBlur={e => e.target.style.borderColor = '#E8E8E8'}
    />
  );
}
const selectStyle = { width: '100%', height: 36, padding: '0 12px', border: '1.5px solid #E8E8E8', borderRadius: 8, fontSize: 13, outline: 'none', background: '#FAFAFA' };

// ─── Inline color swatches for table ────────────────────────────────
function ColorDots({ colors }) {
  if (!colors) return null;
  const list = parseCsv(colors);
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {list.slice(0, 6).map(name => {
        const c = COLORS_ALL.find(x => x.name === name);
        return (
          <div key={name} title={name}
            style={{ width: 14, height: 14, borderRadius: '50%', background: c?.hex ?? '#ccc', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}
          />
        );
      })}
      {list.length > 6 && <span style={{ fontSize: 10, color: '#9CA3AF' }}>+{list.length - 6}</span>}
    </div>
  );
}

// ─── Size chips for table ────────────────────────────────────────────
function SizeChips({ sizes }) {
  if (!sizes) return null;
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {parseCsv(sizes).map(s => (
        <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#F5F5F5', color: '#374151', border: '1px solid #E8E8E8' }}>{s}</span>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────
export default function StockManagementPage() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal]         = useState(null); // null | 'new' | product object
  const [confirmDelete, setConfirmDelete] = useState(null); // product id

  const loadProducts = useCallback(async () => {
    try { setProducts(await api.fetchProducts()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleDelete = async (id) => {
    await api.deleteProduct(id);
    setConfirmDelete(null);
    loadProducts();
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Summary stats
  const totalItems  = products.length;
  const totalValue  = products.reduce((acc, p) => acc + (p.price || 0) * (p.stockQuantity || 0), 0);
  const lowStock    = products.filter(p => p.stockStatus === 'LOW_STOCK').length;
  const outOfStock  = products.filter(p => p.stockStatus === 'OUT_OF_STOCK').length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>Stock Management</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>Manage your product listings, sizes, colours and inventory</p>
        </div>
        <button
          id="stock-add-listing-btn"
          onClick={() => setModal('new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#C0392B', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 20px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(192,57,43,0.3)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#8B0000'}
          onMouseLeave={e => e.currentTarget.style.background = '#C0392B'}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Listing
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '18px 28px 0' }}>
        {[
          { label: 'Total Listings',  value: totalItems,                     color: '#C0392B', icon: '📦' },
          { label: 'Inventory Value', value: `$${totalValue.toFixed(2)}`,    color: '#1A1A1A', icon: '💰' },
          { label: 'Low Stock',       value: lowStock,                        color: '#D97706', icon: '⚠️' },
          { label: 'Out of Stock',    value: outOfStock,                      color: '#6B7280', icon: '🚫' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #E8E8E8' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products, SKU…"
            style={{ width: '100%', height: 36, padding: '0 12px 0 36px', border: '1.5px solid #E8E8E8', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1.5px solid', borderColor: catFilter === cat ? '#C0392B' : '#E8E8E8',
                background: catFilter === cat ? '#C0392B' : '#fff',
                color: catFilter === cat ? '#fff' : '#6B7280',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 28px 28px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading stock data…</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>No listings found</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Try a different search or add your first listing.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9F9F9', borderBottom: '1px solid #E8E8E8' }}>
                  {['Product', 'SKU', 'Sizes', 'Colors', 'Price', 'VAT%', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', color: '#6B7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < filteredProducts.length - 1 ? '1px solid #F0F0F0' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF5'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    {/* Product */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name}
                            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #E8E8E8', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, #C0392B, #8B0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, flexShrink: 0 }}>
                            {p.name?.[0] ?? '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#6B7280', fontFamily: 'monospace', fontSize: 12 }}>{p.sku || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><SizeChips sizes={p.sizes} /></td>
                    <td style={{ padding: '12px 14px' }}><ColorDots colors={p.colors} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#1A1A1A' }}>${(p.price || 0).toFixed(2)}</div>
                      {p.onSale && p.salePrice && (
                        <div style={{ fontSize: 11, color: '#C0392B', fontWeight: 600 }}>Sale: ${p.salePrice.toFixed(2)}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#6B7280' }}>{p.vatRate ?? 15}%</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 700, color: p.stockQuantity > 0 ? '#1A1A1A' : '#C0392B' }}>{p.stockQuantity ?? 0}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`pos-stock-badge ${toBadgeClass(p.stockStatus)}`} style={{ position: 'static', fontSize: 10 }}>
                        {p.stockStatus?.replace('_', ' ') ?? 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal(p)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#C0392B'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E8E8'}
                        >Edit</button>
                        <button onClick={() => setConfirmDelete(p.id)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#C0392B', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FFF0EE'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadProducts(); }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Delete this listing?</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: '9px 22px', borderRadius: 8, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#C0392B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
