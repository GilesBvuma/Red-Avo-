'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../lib/api';
import { Red_Rose } from 'next/font/google';
import { useAuth } from '../../AuthProvider';

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
  { name: 'Burgundy',     hex: '#800020' },
  { name: 'Mustard',      hex: '#FFDB58' },
  { name: 'Olive',        hex: '#808000' },
  { name: 'Charcoal',     hex: '#36454F' },
  { name: 'Peach',        hex: '#FFE5B4' },
  { name: 'Mint Green',   hex: '#98FF98' },
  { name: 'Coral',        hex: '#FF7F50' },
  { name: 'Lilac',        hex: '#C8A2C8' },
  { name: 'Slate Blue',   hex: '#6A5ACD' },
  { name: 'Rose Gold',    hex: '#B76E79' },
  { name: 'Taupe',        hex: '#483C32' },
  { name: 'Chocolate',    hex: '#7B3F00' },
  { name: 'Plum',         hex: '#8E4585' },
  { name: 'Rust',         hex: '#B7410E' },
  { name: 'Sand',         hex: '#C2B280' },
  { name: 'Hot Pink',    hex: '#FF10F0' },
  { name: 'Neon Green',   hex: '#39FF14' },
  { name: 'Electric Blue',hex: '#7DF9FF' },
  { name: 'Red',    hex: '#ff1010ff' },
  
];

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
  vatRate: '0', discount: '0',
  colors: [], sizes: [],
  imageUrls: [], isActive: true,
  variants: []
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

// ─── Multiple Image upload drop zone ──────────────────────────────────────────
function MultipleImageDropZone({ previews, onFiles, onRemove }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFiles = (filesList) => {
    if (!filesList) return;
    const valid = Array.from(filesList).filter(f => f.type.startsWith('image/'));
    if (valid.length) onFiles(valid);
  };

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, flexWrap: 'wrap' }}>
      {previews.map((src, i) => (
        <div key={i} style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #E8E8E8', position: 'relative' }}>
          <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(i); }}
            style={{
              position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', 
              color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12
            }}
          >
            ×
          </button>
        </div>
      ))}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        style={{
          width: 100, height: 100, borderRadius: 8, flexShrink: 0,
          border: `2px dashed ${dragging ? '#C0392B' : '#E8E8E8'}`,
          background: dragging ? 'rgba(192,57,43,0.05)' : '#FAFAFA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 4, cursor: 'pointer',
          transition: 'all 0.2s', position: 'relative',
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center' }}>Click or drop<br/>images</span>
        <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      </div>
    </div>
  );
}

// ─── Modal form ──────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(isEdit ? {
    ...EMPTY_FORM,
    ...product,
    price: product.price ?? '',
    salePrice: product.salePrice ?? '',
    stockQuantity: product.stockQuantity ?? '',
    lowStockThreshold: product.lowStockThreshold ?? '5',
    vatRate: product.vatRate ?? '0',
    discount: product.discount ?? '0',
    colors: parseCsv(product.colors),
    sizes: parseCsv(product.sizes),
    imageUrls: (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []),
    supplierInvoices: product.supplierInvoices || [],
  } : { ...EMPTY_FORM, sku: `RA-${Math.floor(1000 + Math.random() * 9000)}` });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews]     = useState(form.imageUrls || []);
  const [invoiceFiles, setInvoiceFiles] = useState([]);
  const [invoicePreviews, setInvoicePreviews] = useState(form.supplierInvoices || []);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  
  // State for tracking variant stock explicitly
  const [variantStockGrid, setVariantStockGrid] = useState({});

  useEffect(() => {
    if (isEdit && product.variants) {
      const initialGrid = {};
      product.variants.forEach(v => {
        const key = `${v.color || 'Default'}-${v.size || 'Default'}`;
        initialGrid[key] = { id: v.id, stockQuantity: v.stockQuantity, sku: v.sku };
      });
      setVariantStockGrid(initialGrid);
    }
  }, [isEdit, product]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFiles = (files) => {
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    const url = previews[index];
    setPreviews(prev => prev.filter((_, i) => i !== index));
    
    if (form.imageUrls.includes(url)) {
      setForm(prev => ({ ...prev, imageUrls: prev.imageUrls.filter(u => u !== url) }));
    } else {
      const existingCount = previews.filter(p => form.imageUrls.includes(p)).length;
      const fileIndex = index - existingCount;
      if (fileIndex >= 0) {
        setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
    }
  };

  const handleInvoiceFiles = (files) => {
    setInvoiceFiles(prev => [...prev, ...Array.from(files)]);
    const newPreviews = Array.from(files).map(f => URL.createObjectURL(f));
    setInvoicePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveInvoice = (index) => {
    const url = invoicePreviews[index];
    setInvoicePreviews(prev => prev.filter((_, i) => i !== index));
    
    if (form.supplierInvoices.includes(url)) {
      setForm(prev => ({ ...prev, supplierInvoices: prev.supplierInvoices.filter(u => u !== url) }));
    } else {
      const existingCount = invoicePreviews.filter(p => form.supplierInvoices.includes(p)).length;
      const fileIndex = index - existingCount;
      if (fileIndex >= 0) {
        setInvoiceFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
    }
  };

  const getExpectedVariants = () => {
    const hasColors = form.colors.length > 0;
    const hasSizes = form.sizes.length > 0;
    
    if (!hasColors && !hasSizes && (!isEdit || !product.variants)) return [];
    
    const cs = hasColors ? form.colors : ['Default'];
    const ss = hasSizes ? form.sizes : ['Default'];
    
    const vars = [];
    const keysSeen = new Set();
    
    cs.forEach(c => {
      ss.forEach(s => {
        const key = `${c}-${s}`;
        vars.push({ color: c, size: s, key });
        keysSeen.add(key);
      });
    });

    // Recover orphaned variants that still hold stock so they aren't permanently hidden
    if (isEdit && product.variants) {
      product.variants.forEach(v => {
        const c = v.color || 'Default';
        const s = v.size || 'Default';
        const key = `${c}-${s}`;
        if (!keysSeen.has(key) && v.stockQuantity > 0) {
          vars.push({ color: c, size: s, key, orphaned: true });
          keysSeen.add(key);
        }
      });
    }

    return vars;
  };
  const expectedVariants = getExpectedVariants();

  const handleVariantChange = (key, field, value) => {
    setVariantStockGrid(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (!form.price)        { setError('Price is required'); return; }
    setSaving(true); setError('');
    try {
      
      // Build variants payload
      const variantsPayload = [];
      let totalStock = 0;
      
      if (expectedVariants.length > 0) {
        expectedVariants.forEach(ev => {
          const gridData = variantStockGrid[ev.key] || { stockQuantity: 0, sku: '' };
          const qty = parseInt(gridData.stockQuantity) || 0;
          totalStock += qty;
          variantsPayload.push({
            id: gridData.id,
            color: ev.color === 'Default' ? null : ev.color,
            size: ev.size === 'Default' ? null : ev.size,
            sku: gridData.sku || `${form.sku || 'PROD'}-${ev.color.substring(0,3).toUpperCase()}-${ev.size}`,
            stockQuantity: qty,
            costPrice: 0,
            sellPrice: parseFloat(form.price) || 0,
            active: true
          });
        });
      } else {
        totalStock = parseInt(form.stockQuantity) || 0;
      }

      const primaryImageUrl = form.imageUrls.length > 0 ? form.imageUrls[0] : "";

      const payload = {
        ...form,
        imageUrl:          primaryImageUrl,
        imageUrls:         form.imageUrls,
        supplierInvoices:  form.supplierInvoices,
        price:             parseFloat(form.price) || 0,
        salePrice:         form.salePrice ? parseFloat(form.salePrice) : null,
        stockQuantity:     totalStock,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        vatRate:           !isNaN(parseFloat(form.vatRate)) ? parseFloat(form.vatRate) : 0,
        discount:          parseInt(form.discount) || 0,
        colors:            form.colors.join(','),
        sizes:             form.sizes.join(','),
        variants:          variantsPayload.length > 0 ? variantsPayload : null
      };

      let saved;
      if (isEdit) {
        saved = await api.updateProduct(product.id, payload);
      } else {
        saved = await api.createProduct(payload);
      }

      // Upload multiple images if selected
      if (imageFiles.length > 0 && saved.id) {
        await api.uploadProductImages(saved.id, imageFiles);
      }
      
      // Upload multiple supplier invoices if selected
      if (invoiceFiles.length > 0 && saved.id) {
        await api.uploadProductInvoices(saved.id, invoiceFiles);
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
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 740,
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
          {/* Product photos */}
          <Section label="Product Photos (Upload multiple)">
            <div>
              <label>Images</label>
              <MultipleImageDropZone previews={previews} onFiles={handleFiles} onRemove={handleRemoveImage} />
            </div>
          </Section>

          {/* Supplier Invoices */}
          <Section label="Audit Proofs (Optional)">
            <div>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Supplier Invoices</label>
              <MultipleImageDropZone previews={invoicePreviews} onFiles={handleInvoiceFiles} onRemove={handleRemoveInvoice} />
            </div>
          </Section>

          {/* Basic info */}
          <Section label="Basic Info">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Product Name *" fullWidth>
                <Input 
                  placeholder="e.g. Core Training Leggings" 
                  value={form.name} 
                  onChange={v => set('name', v)}
                  style={error && !form.name.trim() ? { borderColor: '#EF4444' } : {}}
                />
              </Field>
              <Field label="Base SKU">
                <Input placeholder="e.g. RA-LGG-001" value={form.sku} onChange={v => set('sku', v)} />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={e => set('category', e.target.value)} style={selectStyle}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Description" fullWidth>
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

          {/* Sizes */}
          <Section label="Available Sizes">
            <SizePicker selected={form.sizes} onChange={v => set('sizes', v)} />
          </Section>

          {/* Colors */}
          <Section label="Available Colors">
            <ColorPicker selected={form.colors} onChange={v => set('colors', v)} />
          </Section>

          {/* Stock */}
          <Section label="Inventory">
            {expectedVariants.length === 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Stock Quantity (Total)">
                  <Input type="number" min="0" placeholder="0" value={form.stockQuantity} onChange={v => set('stockQuantity', v)} />
                </Field>
                <Field label="Low-Stock Alert Threshold">
                  <Input type="number" min="0" placeholder="5" value={form.lowStockThreshold} onChange={v => set('lowStockThreshold', v)} />
                </Field>
              </div>
            ) : (
              <div>
                <p style={{fontSize: 12, color: '#6B7280', marginBottom: 10}}>Specify stock for each variant. Total stock will be automatically calculated.</p>
                <div style={{ border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead style={{ background: '#F9F9F9', borderBottom: '1px solid #E8E8E8' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', color: '#6B7280' }}>Color</th>
                        <th style={{ padding: '8px 12px', color: '#6B7280' }}>Size</th>
                        <th style={{ padding: '8px 12px', color: '#6B7280' }}>Stock Quantity</th>
                        <th style={{ padding: '8px 12px', color: '#6B7280' }}>SKU Override</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expectedVariants.map(ev => (
                        <tr key={ev.key} style={{ borderBottom: '1px solid #F0F0F0', opacity: ev.orphaned ? 0.8 : 1, background: ev.orphaned ? '#FEF2F2' : 'transparent' }}>
                          <td style={{ padding: '8px 12px' }}>
                            {ev.color === 'Default' ? '—' : ev.color}
                            {ev.orphaned && <span style={{ marginLeft: 8, fontSize: 10, background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Orphaned</span>}
                          </td>
                          <td style={{ padding: '8px 12px' }}>{ev.size === 'Default' ? '—' : ev.size}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="number" min="0" placeholder="0" 
                              value={variantStockGrid[ev.key]?.stockQuantity ?? ''} 
                              onChange={e => handleVariantChange(ev.key, 'stockQuantity', e.target.value)}
                              style={{ width: '100%', padding: 6, border: '1px solid #E8E8E8', borderRadius: 4 }} />
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input type="text" placeholder="Auto-generated if empty" 
                              value={variantStockGrid[ev.key]?.sku ?? ''} 
                              onChange={e => handleVariantChange(ev.key, 'sku', e.target.value)}
                              style={{ width: '100%', padding: 6, border: '1px solid #E8E8E8', borderRadius: 4 }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

// ─── Category Modal ──────────────────────────────────────────────────
function CategoryModal({ initialCategory, onClose, onSaved }) {
  const [name, setName] = useState(initialCategory ? initialCategory.name : '');
  const [description, setDescription] = useState(initialCategory ? initialCategory.description : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [previews, setPreviews] = useState(initialCategory?.imageUrl ? [initialCategory.imageUrl] : []);

  const handleFiles = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const file = Array.from(filesList).find(f => f.type.startsWith('image/'));
    if (file) {
      setImageFile(file);
      setPreviews([URL.createObjectURL(file)]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    setSaving(true);
    try {
      const data = { name, description };
      if (previews.length === 0) data.imageUrl = null;
      
      let saved;
      if (initialCategory?.id) {
        saved = await api.updateCategory(initialCategory.id, data);
      } else {
        saved = await api.createCategory(data);
      }
      
      if (imageFile && saved.id) {
        await api.uploadCategoryImage(saved.id, imageFile);
      }
      
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(0,0,0,0.55)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '24px 28px'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#1A1A1A' }}>{initialCategory ? 'Edit Category' : 'Add Category'}</h3>
        {error && <div style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <Field label="Category Name *">
            <Input value={name} onChange={setName} placeholder="e.g. Activewear" required />
          </Field>
          <div style={{ marginTop: 14 }}>
            <Field label="Description">
              <Input value={description} onChange={setDescription} placeholder="Optional description..." />
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Image</label>
            <MultipleImageDropZone previews={previews} onFiles={handleFiles} onRemove={handleRemoveImage} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #E8E8E8', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#C0392B', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────
export default function StockManagementPage() {
  const { user } = useAuth();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores]       = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal]           = useState(null);
  const [editingProd, setEditingProd] = useState(null);
  
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null); // product id

  const parseDate = (d) => {
    if (!d) return 0;
    if (Array.isArray(d)) {
      // [year, month, day, hour, minute, second]
      return new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0, d[5] || 0).getTime();
    }
    return new Date(d).getTime();
  };

  const loadData = useCallback(async () => {
    try { 
      const [prods, cats, stors, levels] = await Promise.all([
        api.fetchProducts(),
        api.fetchCategories(),
        api.fetchStores(),
        api.fetchStockLevels(user?.role === 'ADMIN' ? undefined : user?.storeId)
      ]);
      setProducts(prods); 
      setCategories(cats);
      setStores(stors);
      setStockLevels(levels);
    }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    await api.deleteProduct(id);
    setConfirmDelete(null);
    loadData();
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  }).sort((a, b) => parseDate(b.updatedAt || b.createdAt) - parseDate(a.updatedAt || a.createdAt));

  // Calculate stock by location per product
  const variantToProduct = {};
  products.forEach(p => {
    p.variants?.forEach(v => {
      variantToProduct[v.id] = p.id;
    });
  });

  const productStockByStore = {}; // productId -> { storeId: quantity }
  stockLevels.forEach(sl => {
    const pid = variantToProduct[sl.variant?.id];
    if (pid) {
      if (!productStockByStore[pid]) productStockByStore[pid] = {};
      productStockByStore[pid][sl.storeId] = (productStockByStore[pid][sl.storeId] || 0) + sl.quantity;
    }
  });

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
        <div style={{ display: 'flex', gap: 12 }}>
          {catFilter !== 'All' && (
            <>
              <button
                onClick={() => {
                  const catObj = categories.find(c => c.name === catFilter);
                  if (catObj) {
                    setEditingCategory(catObj);
                    setCatModalOpen(true);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff', color: '#1A1A1A', border: '1.5px solid #E8E8E8',
                  borderRadius: 10, padding: '10px 20px', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                Edit Category
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete the category "${catFilter}"?`)) {
                    const catObj = categories.find(c => c.name === catFilter);
                    if (catObj) {
                      try {
                        await api.deleteCategory(catObj.id);
                        setCatFilter('All');
                        loadData();
                      } catch (err) {
                        alert(err.message || 'Failed to delete category');
                      }
                    }
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fff', color: '#C0392B', border: '1.5px solid #C0392B',
                  borderRadius: 10, padding: '10px 20px', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                Delete Category
              </button>
            </>
          )}
          <button
            onClick={() => { setEditingCategory(null); setCatModalOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', color: '#1A1A1A', border: '1.5px solid #E8E8E8',
              borderRadius: 10, padding: '10px 20px', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
            }}
          >
            + Add Category
          </button>
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
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {['All', ...categories.map(c => c.name)].map(cat => (
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
                  {['Product', 'SKU', 'Sizes', 'Colors', 'Price', 'VAT%', user?.role === 'ADMIN' ? 'Location Breakdown' : 'Stock (Local)', 'Status', 'Actions'].map(h => (
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
                    <td style={{ padding: '12px 14px', minWidth: 140 }}>
                      {user?.role === 'ADMIN' ? (
                        <>
                          <div style={{ fontWeight: 700, color: p.stockQuantity > 0 ? '#1A1A1A' : '#C0392B', marginBottom: 6 }}>
                            {p.stockQuantity ?? 0} (Global Total)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderLeft: '2px solid #E8E8E8', paddingLeft: 8 }}>
                            {stores.map(store => {
                              const qty = productStockByStore[p.id]?.[store.id] || 0;
                              return (
                                <div key={store.id} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: '#6B7280' }}>{store.name}</span>
                                  <span style={{ fontWeight: 600, color: qty > 0 ? '#0D9488' : '#9CA3AF', background: qty > 0 ? '#F0FDFA' : '#F9FAFB', padding: '1px 6px', borderRadius: 4 }}>
                                    {qty}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 700, color: (productStockByStore[p.id]?.[user?.storeId] || 0) > 0 ? '#1A1A1A' : '#C0392B' }}>
                          {productStockByStore[p.id]?.[user?.storeId] || 0}
                        </div>
                      )}
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
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadData(); }}
        />
      )}

      {/* Category modal */}
      {catModalOpen && (
        <CategoryModal
          initialCategory={editingCategory}
          onClose={() => { setCatModalOpen(false); setEditingCategory(null); }}
          onSaved={() => { setCatModalOpen(false); setEditingCategory(null); loadData(); }}
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
