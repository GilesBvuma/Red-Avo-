'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Reusable Excel import/export panel.
 *
 * Props:
 *  - entityLabel:    "Customers" | "Inventory"
 *  - importFn:       async (file) => ImportResultDTO — calls the backend
 *  - exportFn:       async () => void — generates and downloads the .xlsx
 *  - onImportSuccess: () => void — called after a successful/partial import to refresh data
 */
export default function ExcelImportExport({ entityLabel, importFn, exportFn, onImportSuccess }) {
  const [dragging, setDragging]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [result, setResult]         = useState(null);    // ImportResultDTO
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  // ── Drag-and-drop handlers ─────────────────────────────────────
  const onDragOver  = useCallback(e => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop      = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  // ── File validation and upload ─────────────────────────────────
  const handleFile = async (file) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setResult({
        status: 'FAILED',
        filename: file.name,
        errors: ['Only .xlsx and .xls files are accepted.'],
        totalRows: 0, successful: 0, failed: 0, skipped: 0
      });
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const res = await importFn(file);
      setResult(res);
      setErrorsExpanded(false);
      if (res.status === 'SUCCESS' || res.status === 'PARTIAL') {
        onImportSuccess?.();
      }
    } catch (err) {
      setResult({
        status: 'FAILED',
        filename: file.name,
        errors: [err.message || 'Unknown error during upload.'],
        totalRows: 0, successful: 0, failed: 0, skipped: 0
      });
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileInputChange = e => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportFn(); }
    catch (err) { console.error('Export failed:', err); }
    finally { setExporting(false); }
  };

  // ── Status style helpers ───────────────────────────────────────
  const statusColors = {
    SUCCESS: { bg: '#D1FAE5', border: '#10B981', text: '#065F46', icon: '✅' },
    PARTIAL: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', icon: '⚠️' },
    FAILED:  { bg: '#FEE2E2', border: '#EF4444', text: '#7F1D1D', icon: '❌' },
  };
  const style = result ? (statusColors[result.status] || statusColors.FAILED) : null;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      <h4 style={{ margin: '0 0 1rem', fontSize: '15px', fontWeight: '700', color: '#111827' }}>
        📊 {entityLabel} — Excel Import / Export
      </h4>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Drop zone ──────────────────────────────────────────── */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            flex: '1 1 240px',
            minHeight: '110px',
            border: `2px dashed ${dragging ? '#C0392B' : '#D1D5DB'}`,
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragging ? '#FEF2F2' : '#F9FAFB',
            transition: 'all 0.2s',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          {uploading ? (
            <>
              <div style={spinnerStyle} />
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Uploading and processing…</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '28px' }}>📂</span>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>
                Drop .xlsx file here
              </span>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>or click to browse</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={onFileInputChange}
            disabled={uploading}
          />
        </div>

        {/* ── Export button ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: '#1A1A1A',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: exporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: exporting ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {exporting ? <div style={spinnerStyleWhite} /> : '⬇️'}
            {exporting ? 'Generating…' : `Export ${entityLabel}`}
          </button>
          <span style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>Downloads live data</span>
        </div>
      </div>

      {/* ── Import result banner ─────────────────────────────────── */}
      {result && (
        <div style={{
          marginTop: '1rem',
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: '8px',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: '700', color: style.text, fontSize: '14px' }}>
                {style.icon} Import {result.status}
              </span>
              {result.filename && (
                <span style={{ fontSize: '12px', color: style.text, marginLeft: '8px', opacity: 0.8 }}>
                  {result.filename}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: style.text }}>
              <span>✅ {result.successful ?? 0} imported</span>
              {result.failed  > 0 && <span>❌ {result.failed}  failed</span>}
              {result.skipped > 0 && <span>⏭️ {result.skipped} skipped</span>}
            </div>
          </div>

          {/* Expandable error list */}
          {result.errors?.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={() => setErrorsExpanded(p => !p)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: style.text, fontSize: '12px', fontWeight: '600', padding: 0,
                }}
              >
                {errorsExpanded ? '▲' : '▼'} {result.errors.length} row-level message{result.errors.length !== 1 ? 's' : ''}
              </button>
              {errorsExpanded && (
                <ul style={{
                  margin: '8px 0 0', padding: '0 0 0 1.2rem',
                  maxHeight: '200px', overflowY: 'auto',
                  fontSize: '12px', color: style.text, lineHeight: '1.6',
                }}>
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const spinnerStyle = {
  width: '22px', height: '22px',
  border: '3px solid #E5E7EB',
  borderTop: '3px solid #C0392B',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
};

const spinnerStyleWhite = {
  width: '14px', height: '14px',
  border: '2px solid rgba(255,255,255,0.4)',
  borderTop: '2px solid #fff',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  display: 'inline-block',
};
