'use client';

import { useState, useEffect } from 'react';
import {
  fetchAdminCommunityPosts,
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  toggleCommunityPostActive,
  uploadCommunityFile,
} from '../lib/api';

const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || '';

const EMPTY_FORM = {
  instagramHandle: '',
  coverImageUrl: '',
  mediaUrl: '',
  mediaType: 'IMAGE',
  displayOrder: 0,
  active: true,
};

export default function CommunityTab() {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError]           = useState('');

  // ── Load posts ──────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCommunityPosts();
      setPosts(data || []);
    } catch (e) {
      setError('Failed to load posts: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Open create form ────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError('');
    setShowForm(true);
  };

  // ── Open edit form ──────────────────────────────────────────────
  const openEdit = (post) => {
    setForm({
      instagramHandle: post.instagramHandle,
      coverImageUrl:   post.coverImageUrl,
      mediaUrl:        post.mediaUrl,
      mediaType:       post.mediaType,
      displayOrder:    post.displayOrder,
      active:          post.active,
    });
    setEditId(post.id);
    setError('');
    setShowForm(true);
  };

  // ── Cover image upload ──────────────────────────────────────────
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { url } = await uploadCommunityFile(file, 'cover');
      setForm(f => ({ ...f, coverImageUrl: url }));
    } catch (e) {
      setError('Cover upload failed: ' + e.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // ── Media upload ────────────────────────────────────────────────
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    // Auto-detect media type
    const isVideo = file.type.startsWith('video/');
    try {
      const { url } = await uploadCommunityFile(file, 'media');
      setForm(f => ({ ...f, mediaUrl: url, mediaType: isVideo ? 'VIDEO' : 'IMAGE' }));
    } catch (e) {
      setError('Media upload failed: ' + e.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.instagramHandle.trim()) { setError('Instagram handle is required.'); return; }
    if (!form.coverImageUrl)          { setError('Cover image is required.');       return; }
    if (!form.mediaUrl)               { setError('Media file is required.');         return; }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await updateCommunityPost(editId, form);
      } else {
        await createCommunityPost(form);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setError('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Delete this community post?')) return;
    try {
      await deleteCommunityPost(id);
      setPosts(p => p.filter(x => x.id !== id));
    } catch (e) {
      setError('Delete failed: ' + e.message);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      const updated = await toggleCommunityPostActive(id);
      setPosts(p => p.map(x => x.id === id ? updated : x));
    } catch (e) {
      setError('Toggle failed: ' + e.message);
    }
  };

  // ── Styles (inline, matching existing MarketingPage pattern) ────
  const card  = { border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.5rem', background: '#fff' };
  const label = { fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px', display: 'block' };
  const input = {
    width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px',
  };
  const btn   = (bg, color='#fff') => ({
    background: bg, color, border: 'none', padding: '8px 16px',
    borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Community Posts</h3>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0' }}>
            Manage the Instagram community grid shown on the storefront home page.
          </p>
        </div>
        <button onClick={openCreate} style={btn('#111827')}>+ Add New</button>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '6px', marginBottom: '1rem', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── Form ── */}
      {showForm && (
        <div style={{ ...card, marginBottom: '2rem', background: '#F9FAFB' }}>
          <h4 style={{ margin: '0 0 1rem' }}>{editId ? 'Edit Post' : 'New Community Post'}</h4>

          {/* Instagram handle */}
          <label style={label}>Instagram Handle <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(no @ or URL)</span></label>
          <input
            id="community-handle"
            style={input}
            placeholder="e.g. redavo_activewear"
            value={form.instagramHandle}
            onChange={e => setForm(f => ({ ...f, instagramHandle: e.target.value.replace(/[@\s]/g, '') }))}
          />
          {form.instagramHandle && (
            <p style={{ fontSize: '12px', color: '#3B82F6', margin: '-8px 0 12px' }}>
              → <a href={`https://instagram.com/${form.instagramHandle}`} target="_blank" rel="noreferrer">
                  instagram.com/{form.instagramHandle}
                </a>
            </p>
          )}

          {/* Cover image */}
          <label style={label}>Cover Image <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(jpg/png/webp, max 20 MB)</span></label>
          <input id="community-cover-upload" type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverUpload} style={{ ...input, padding: '4px' }} />
          {uploadingCover && <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '-8px' }}>Uploading cover…</p>}
          {form.coverImageUrl && (
            <div style={{ marginBottom: '12px' }}>
              <img src={`${MEDIA_URL}${form.coverImageUrl}`} alt="Cover preview"
                style={{ width: 100, height: 120, objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{form.coverImageUrl}</span>
            </div>
          )}

          {/* Media file */}
          <label style={label}>Media File <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(image or mp4, max 20 MB — type auto-detected)</span></label>
          <input id="community-media-upload" type="file" accept="image/jpeg,image/png,image/webp,video/mp4"
            onChange={handleMediaUpload} style={{ ...input, padding: '4px' }} />
          {uploadingMedia && <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '-8px' }}>Uploading media…</p>}
          {form.mediaUrl && (
            <div style={{ marginBottom: '12px' }}>
              {form.mediaType === 'VIDEO'
                ? <video src={`${MEDIA_URL}${form.mediaUrl}`} style={{ width: 120, height: 160, objectFit: 'cover', borderRadius: '6px' }} controls muted />
                : <img src={`${MEDIA_URL}${form.mediaUrl}`} alt="Media preview"
                    style={{ width: 120, height: 160, objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
              }
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{form.mediaType} · {form.mediaUrl}</span>
            </div>
          )}

          {/* Display order + Active */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 160px' }}>
              <label style={label}>Display Order</label>
              <input id="community-display-order" type="number" style={input} value={form.displayOrder}
                onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ ...label, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" id="community-active-toggle" checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Active (visible on storefront)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button id="community-save-btn" onClick={handleSave} disabled={saving} style={btn('#C0392B')}>
              {saving ? 'Saving…' : editId ? 'Update Post' : 'Create Post'}
            </button>
            <button onClick={() => { setShowForm(false); setError(''); }} style={btn('#F3F4F6', '#374151')}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <p style={{ color: '#6B7280' }}>Loading posts…</p>
      ) : posts.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px', color: '#9CA3AF', border: '2px dashed #E5E7EB' }}>
          No community posts yet. Click <strong>+ Add New</strong> to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {posts.map(post => (
            <div key={post.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Thumbnail */}
              <img
                src={`${MEDIA_URL}${post.coverImageUrl}`}
                alt={`@${post.instagramHandle}`}
                style={{ width: 56, height: 72, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>@{post.instagramHandle}</div>
                <a href={`https://instagram.com/${post.instagramHandle}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>
                  instagram.com/{post.instagramHandle}
                </a>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', background: '#F3F4F6', borderRadius: '4px', padding: '2px 6px', color: '#6B7280' }}>
                    {post.mediaType}
                  </span>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>Order: {post.displayOrder}</span>
                </div>
              </div>

              {/* Active badge */}
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px',
                background: post.active ? '#ECFDF5' : '#FEE2E2',
                color:      post.active ? '#10B981' : '#EF4444',
              }}>
                {post.active ? 'Active' : 'Inactive'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button onClick={() => handleToggle(post.id)}
                  style={btn(post.active ? '#FEF3C7' : '#ECFDF5', post.active ? '#92400E' : '#065F46')}>
                  {post.active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => openEdit(post)} style={btn('#EFF6FF', '#1D4ED8')}>Edit</button>
                <button onClick={() => handleDelete(post.id)} style={btn('#FEE2E2', '#DC2626')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
