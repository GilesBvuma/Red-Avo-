'use client';

import { useEffect } from 'react';
import { checkAndTriggerAbandonedCart } from '@/hooks/useAbandonedCart';

/**
 * AbandonedCartMonitor
 * Mounts in the root layout. On every page load, checks if there is
 * a stale cart snapshot and fires a recovery notification if needed.
 * Renders nothing visible.
 */
export default function AbandonedCartMonitor() {
  useEffect(() => {
    // Small delay to not compete with page render
    const timer = setTimeout(() => {
      checkAndTriggerAbandonedCart();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
