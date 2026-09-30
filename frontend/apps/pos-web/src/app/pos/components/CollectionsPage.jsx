'use client';

import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/** Returns auth headers from the POS session token */
function authHeaders(extra = {}) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('redavo_token') : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/* ── helpers ── */
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  isActive: true,
  sortOrder: 0,
};

/* ── main component ── */
export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, otherwise collection object
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);

  const coverInputRef = useRef();
  const heroInputRef = useRef();

  /* ── load data ── */
  useEffect(() => {
    Promise.all([
      fetch(`${API}/collections/admin/all`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/products`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([cols, prods]) => {
      setCollections(Array.isArray(cols) ? cols : []);
      setAllProducts(Array.isArray(prods) ? prods : []);
    }).catch(() => {
      setCollections([]);
      setAllProducts([]);
    }).finally(() => setLoading(false));
  }, []);

  /* ── open modal ── */
  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSelectedProductIds([]);
    setCoverFile(null); setCoverPreview(null);
    setHeroFile(null);  setHeroPreview(null);
    setModalOpen(true);
  }

  function openEdit(col) {
    setEditTarget(col);
    setForm({
      name:        col.name        || '',
      slug:        col.slug        || '',
      description: col.description || '',
      isActive:    col.isActive    ?? true,
      sortOrder:   col.sortOrder   ?? 0,
    });
    setSelectedProductIds((col.products || []).map(p => p.id));
    setCoverFile(null); setCoverPreview(col.coverImageUrl || null);
    setHeroFile(null);  setHeroPreview(col.heroImageUrl  || null);
    setModalOpen(true);
  }

  /* ── save ── */
  async function handleSave() {
    if (!form.name.trim()) return alert('Please enter a collection name.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug.trim() || slugify(form.name),
      };

      // Step 1: Create or update the collection metadata first to get a real id
      let saved;
      if (editTarget) {
        const r = await fetch(`${API}/collections/${editTarget.id}`, {
          method: 'PUT',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`Failed to update collection: ${r.status}`);
        saved = await r.json();
      } else {
        const r = await fetch(`${API}/collections`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`Failed to create collection: ${r.status}`);
        saved = await r.json();
      }

      const id = saved.id;
      if (!id) throw new Error('Server did not return a collection id.');

      // Step 2: Upload cover image (only if a new file was picked)
      if (coverFile) {
        const fd = new FormData();
        fd.append('file', coverFile);
        const r = await fetch(`${API}/collections/${id}/cover-image`, {
          method: 'POST',
          headers: authHeaders(), // no Content-Type — browser sets multipart boundary
          body: fd,
        });
        if (r.ok) saved = await r.json();
      }

      // Step 3: Upload hero image (only if a new file was picked)
      if (heroFile) {
        const fd = new FormData();
        fd.append('file', heroFile);
        const r = await fetch(`${API}/collections/${id}/hero-image`, {
          method: 'POST',
          headers: authHeaders(),
          body: fd,
        });
        if (r.ok) saved = await r.json();
      }

      // Step 4: Sync selected products
      await fetch(`${API}/collections/${id}/products`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ productIds: selectedProductIds }),
      });

      // Step 5: Refresh the admin list
      const updated = await fetch(`${API}/collections/admin/all`, { headers: authHeaders() }).then(r => r.json());
      setCollections(Array.isArray(updated) ? updated : []);
      setModalOpen(false);
    } catch (err) {
      alert('Error saving collection: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ── delete ── */
  async function handleDelete(col) {
    setDeleteConfirm(null);
    try {
      await fetch(`${API}/collections/${col.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setCollections(prev => prev.filter(c => c.id !== col.id));
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  }

  /* ── product picker ── */
  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  function toggleProduct(id) {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  /* ── file pick helpers ── */
  function onCoverPick(e) {
    const f = e.target.files[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  }
  function onHeroPick(e) {
    const f = e.target.files[0];
    if (!f) return;
    setHeroFile(f);
    setHeroPreview(URL.createObjectURL(f));
  }

  /* ── render ── */
  return (
    <div className="pos-page-wrap" style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a2b4a', margin: 0 }}>Collections</h1>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 4 }}>
            Curate product groups shown on the storefront /collections page
          </p>
        </div>
        <button
          id="btn-new-collection"
          onClick={openCreate}
          style={{
            background: '#8F0D13', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Collection
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: '#6b7280', textAlign: 'center', paddingTop: 60 }}>Loading collections…</p>
      ) : collections.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80, color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
          <p style={{ fontWeight: 600, fontSize: '1rem' }}>No collections yet</p>
          <p style={{ fontSize: '0.85rem' }}>Create your first collection above.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {['Cover', 'Name', 'Slug', 'Products', 'Order', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {collections.map(col => (
                <tr key={col.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px' }}>
                    {col.coverImageUrl ? (
                      <img
                        src={col.coverImageUrl.startsWith('/uploads') ? `http://localhost:8080${col.coverImageUrl}` : col.coverImageUrl}
                        alt={col.name}
                        style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                      />
                    ) : (
                      <div style={{ width: 52, height: 52, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 20 }}>🖼️</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1a2b4a' }}>{col.name}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.82rem' }}>{col.slug}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{(col.products || []).length}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{col.sortOrder}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      background: col.isActive ? '#d1fae5' : '#fee2e2',
                      color: col.isActive ? '#065f46' : '#991b1b',
                      padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      {col.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => openEdit(col)}
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                      >Edit</button>
                      <button
                        onClick={() => setDeleteConfirm(col)}
                        style={{ background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 780,
            maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}>
            {/* Close */}
            <button onClick={() => setModalOpen(false)} style={{
              position: 'absolute', top: 16, right: 16, background: '#f3f4f6',
              border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#374151',
            }}>×</button>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a2b4a', marginBottom: 24 }}>
              {editTarget ? `Edit: ${editTarget.name}` : 'New Collection'}
            </h2>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Collection Name *</label>
                <input
                  id="input-collection-name"
                  value={form.name}
                  onChange={e => {
                    const v = e.target.value;
                    setForm(f => ({ ...f, name: v, slug: slugify(v) }));
                  }}
                  placeholder="e.g. Summer Drops"
                  style={inputStyle}
                />
              </div>

              {/* Slug */}
              <div>
                <label style={labelStyle}>URL Slug</label>
                <input
                  id="input-collection-slug"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated"
                  style={inputStyle}
                />
              </div>

              {/* Sort order */}
              <div>
                <label style={labelStyle}>Sort Order</label>
                <input
                  id="input-collection-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  id="input-collection-desc"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Short description shown on the collections page…"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Active toggle */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Active (visible on storefront)</label>
                <div
                  id="toggle-collection-active"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s',
                    background: form.isActive ? '#8F0D13' : '#d1d5db', position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: form.isActive ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </div>
            </div>

            {/* Image uploads */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Cover image */}
              <div>
                <label style={labelStyle}>Cover Image <span style={{ color: '#9ca3af', fontWeight: 400 }}>(card thumbnail)</span></label>
                <div
                  onClick={() => coverInputRef.current.click()}
                  style={imageUploadBox}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Click to upload</span>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverPick} />
              </div>

              {/* Hero image */}
              <div>
                <label style={labelStyle}>Hero Image <span style={{ color: '#9ca3af', fontWeight: 400 }}>(full-bleed banner)</span></label>
                <div
                  onClick={() => heroInputRef.current.click()}
                  style={imageUploadBox}
                >
                  {heroPreview ? (
                    <img src={heroPreview} alt="hero" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Click to upload</span>
                  )}
                </div>
                <input ref={heroInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onHeroPick} />
              </div>
            </div>

            {/* Product picker */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>
                Products in this collection
                <span style={{ background: '#8F0D13', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700, marginLeft: 8 }}>
                  {selectedProductIds.length} selected
                </span>
              </label>
              <input
                id="input-product-search"
                placeholder="Search inventory…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, maxHeight: 260, overflowY: 'auto' }}>
                {filteredProducts.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24, fontSize: '0.85rem' }}>No products found</p>
                ) : filteredProducts.map(p => {
                  const checked = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      id={`product-pick-${p.id}`}
                      onClick={() => toggleProduct(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', cursor: 'pointer',
                        background: checked ? '#fff7f7' : '#fff',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? '#8F0D13' : '#d1d5db'}`,
                        background: checked ? '#8F0D13' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      {(p.imageUrl || (p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null)) && (
                        <img
                          src={(p.imageUrl || p.imageUrls[0]).startsWith('/uploads') ? `http://localhost:8080${p.imageUrl || p.imageUrls[0]}` : (p.imageUrl || p.imageUrls[0])}
                          alt={p.name}
                          style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1a2b4a', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{p.category} · ZWL {p.price?.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, cursor: 'pointer' }}
              >Cancel</button>
              <button
                id="btn-save-collection"
                onClick={handleSave}
                disabled={saving}
                style={{ background: '#8F0D13', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#1a2b4a', fontWeight: 700, marginBottom: 12 }}>Delete Collection?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 24 }}>
              "<strong>{deleteConfirm.name}</strong>" will be permanently removed from the storefront. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ background: '#8F0D13', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared styles ── */
const labelStyle = {
  display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#374151', marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
  fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', color: '#1a2b4a',
};
const imageUploadBox = {
  width: '100%', height: 140, border: '2px dashed #e5e7eb', borderRadius: 10,
  cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: '#fafafa', transition: 'border-color 0.2s',
};
