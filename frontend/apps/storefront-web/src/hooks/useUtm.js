'use client';

/**
 * useUtm
 * ──────────────────────────────────────────────────────────────────
 * Reads UTM params from the current URL and persists them to
 * sessionStorage under the key "ra_utm". UTMs survive same-session
 * navigation (e.g. landing → shop → checkout) but are cleared when
 * the browser session ends.
 *
 * Call getStoredUtm() anywhere to retrieve the captured params.
 */

const UTM_KEY = 'ra_utm';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

/** Reads UTMs from URL, persists to sessionStorage if any are present. */
export function captureUtm() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  let found = false;
  for (const key of UTM_PARAMS) {
    const val = params.get(key);
    if (val) {
      utm[key] = val;
      found = true;
    }
  }
  if (found) {
    try {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    } catch {
      // sessionStorage unavailable (private mode edge case) — silently skip
    }
  }
}

/** Returns the stored UTM object or null if none captured this session. */
export function getStoredUtm() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
