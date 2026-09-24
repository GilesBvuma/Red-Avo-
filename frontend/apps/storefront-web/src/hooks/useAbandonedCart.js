'use client';

/**
 * useAbandonedCart
 * ──────────────────────────────────────────────────────────────────
 * Client-side abandoned-cart detection and recovery trigger.
 *
 * HOW IT WORKS:
 * 1. The checkout form calls `saveAbandonedCartSnapshot(email, name, cartItems)`
 *    whenever the user fills in their email. This saves a timestamped
 *    snapshot to localStorage as "ra_abandoned_cart".
 *
 * 2. On every page load (mounted via the root layout), `checkAndTrigger()`
 *    reads the snapshot. If the cart has been idle for ≥ 1 hour,
 *    it POSTs to /api/abandoned-cart/notify (backend fires email + WA).
 *
 * 3. `clearAbandonedCart()` is called from CartContext.clearCart() to
 *    delete the snapshot when a purchase is completed.
 *
 * RATE-LIMITING: the backend enforces a 24h cooldown per email.
 * The frontend also deletes the snapshot after triggering to prevent
 * repeated requests from the same device.
 */

const ABANDONED_KEY  = 'ra_abandoned_cart';
const IDLE_THRESHOLD = 60 * 60 * 1000; // 1 hour in ms
const API_URL        = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * Called from the checkout form when the user types their email.
 * Saves a timestamped snapshot so we can detect abandonment later.
 */
export function saveAbandonedCartSnapshot(email, name, cartItems) {
  if (!email || typeof window === 'undefined') return;
  try {
    const itemCount = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
    const cartValue = cartItems.reduce((s, i) => {
      if (i.isGiftCard) return s + Number(i.amount || 0);
      const price = i.variant?.sellPrice > 0 ? i.variant.sellPrice : (i.product?.price || 0);
      return s + price * (i.quantity || 1);
    }, 0);

    const snapshot = {
      email,
      name,
      itemCount,
      cartValue: `$${cartValue.toFixed(2)}`,
      cartSummary: `${itemCount} item${itemCount !== 1 ? 's' : ''}`,
      savedAt: Date.now(),
    };
    localStorage.setItem(ABANDONED_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage unavailable — silently skip
  }
}

/**
 * Called from the root layout on mount.
 * Reads the snapshot and fires a recovery notification if cart is stale.
 */
export async function checkAndTriggerAbandonedCart() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(ABANDONED_KEY);
    if (!raw) return;

    const snapshot = JSON.parse(raw);
    const age = Date.now() - (snapshot.savedAt || 0);

    if (age < IDLE_THRESHOLD) return; // not stale yet

    // Remove snapshot first to prevent duplicate triggers
    localStorage.removeItem(ABANDONED_KEY);

    // Fire backend notification
    await fetch(`${API_URL}/abandoned-cart/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:       snapshot.email,
        name:        snapshot.name,
        cartSummary: snapshot.cartSummary,
        cartValue:   snapshot.cartValue,
      }),
    });
  } catch {
    // Network error or parse error — silently swallow
  }
}

/** Called when a purchase is completed (cart cleared). */
export function clearAbandonedCart() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ABANDONED_KEY);
  } catch {
    // silently skip
  }
}
