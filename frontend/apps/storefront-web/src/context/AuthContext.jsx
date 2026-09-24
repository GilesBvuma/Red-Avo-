'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';

const AuthContext = createContext(null);

const COOKIE_NAME = 'storefront_token';
const COOKIE_DAYS = 30;

// ── Cookie helpers ─────────────────────────────────────────────────────────
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ── Auth Provider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [token, setToken]       = useState(null);
  const [loading, setLoading]   = useState(true); // true while checking saved session

  // ── Auto-restore session from cookie on mount ──────────────────────────
  useEffect(() => {
    async function restoreSession() {
      const saved = getCookie(COOKIE_NAME);
      if (!saved) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/wishlist/validate`, {
          headers: { Authorization: `Bearer ${saved}` },
        });
        if (res.ok) {
          const data = await res.json();
          setToken(saved);
          setCustomer({ id: data.customerId, email: data.email });
        } else {
          // Token expired or invalid — clear it
          deleteCookie(COOKIE_NAME);
        }
      } catch (e) {
        // Network issue — don't log out, just skip
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // ── sendOtp ────────────────────────────────────────────────────────────
  const sendOtp = useCallback(async (email) => {
    const res = await fetch(`${API_URL}/customers/auth/otp/send`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Failed to send OTP');
  }, []);

  // ── verifyOtp → logs the customer in and stores a 30-day cookie ────────
  const verifyOtp = useCallback(async (email, otp) => {
    const res = await fetch(`${API_URL}/customers/auth/otp/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, otp }),
    });
    if (!res.ok) throw new Error('Invalid or expired OTP');
    const data = await res.json();
    // data: { exists, customer, token }
    const jwt = data.token;
    const c   = data.customer;
    setCookie(COOKIE_NAME, jwt, COOKIE_DAYS);
    setToken(jwt);
    setCustomer(c);
    return { customer: c, token: jwt, isNew: !data.exists };
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    deleteCookie(COOKIE_NAME);
    setToken(null);
    setCustomer(null);
    // Clear local wishlist too
    try { localStorage.removeItem('storefront_wishlist'); } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{
      customer,
      token,
      isLoggedIn: !!customer,
      loading,
      sendOtp,
      verifyOtp,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
