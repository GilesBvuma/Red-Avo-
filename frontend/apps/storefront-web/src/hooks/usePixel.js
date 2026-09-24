'use client';

/**
 * usePixel
 * ──────────────────────────────────────────────────────────────────
 * Thin wrapper around the Meta Pixel fbq() function.
 * Guards against SSR (no window) and missing pixel (ID not set).
 *
 * Standard events we use:
 *   AddToCart        — when a product is added to the cart
 *   InitiateCheckout — when checkout page mounts with items
 *   Purchase         — when an order is confirmed
 *
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */

export function usePixel() {
  const track = (event, data = {}) => {
    if (typeof window === 'undefined') return;
    if (!window.fbq) return; // Pixel not loaded (ID not configured)
    window.fbq('track', event, data);
  };

  return { track };
}

/**
 * Standalone helper — usable outside React components
 * (e.g. in CartContext which isn't a component itself).
 */
export function trackPixelEvent(event, data = {}) {
  if (typeof window === 'undefined') return;
  if (!window.fbq) return;
  window.fbq('track', event, data);
}
