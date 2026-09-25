'use client';

import { useEffect } from 'react';
import { captureUtm } from '@/hooks/useUtm';

/**
 * UtmCapture — mounts once in the root layout.
 * Silently captures UTM params from the URL into sessionStorage
 * so they can be attached to an order at checkout.
 * Renders nothing.
 */
export default function UtmCapture() {
  useEffect(() => {
    captureUtm();
  }, []);

  return null;
}
