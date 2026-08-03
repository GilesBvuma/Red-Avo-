'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const TOAST_DURATION = 4500;

export function NotificationToast({ toasts, onRemove }) {
  return (
    <div className="pos-toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), TOAST_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove]);

  const icons = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
    demo:    '🔔',
  };

  return (
    <div className={`pos-toast ${toast.type || 'info'}`} role="alert">
      <span className="pos-toast-icon">{icons[toast.type] || 'ℹ️'}</span>
      <div className="pos-toast-body">
        {toast.title && <div className="pos-toast-title">{toast.title}</div>}
        <div className="pos-toast-msg">{toast.message}</div>
      </div>
      <button
        className="pos-toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
