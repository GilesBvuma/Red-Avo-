'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
const LOCAL_IDS_KEY  = 'storefront_wishlist';
const LOCAL_PRODS_KEY = 'storefront_wishlist_products';

export function WishlistProvider({ children }) {
  const { isLoggedIn, token, loading: authLoading } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [products, setProducts]       = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // ── Load wishlist whenever auth state settles ──────────────────────────
  useEffect(() => {
    if (authLoading) return;

    if (isLoggedIn) {
      loadServerWishlist();
    } else {
      loadLocalWishlist();
    }
  }, [isLoggedIn, authLoading]);

  // ── Server-backed wishlist (logged in) ────────────────────────────────
  async function loadServerWishlist() {
    if (!token) return;
    setLoadingWishlist(true);
    try {
      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      // Normalise prices to numbers to prevent toFixed() errors
      const serverProducts = (data.products || []).map(normaliseProduct);

      setWishlistIds(new Set((data.productIds || []).map(String)));
      setProducts(serverProducts);

      // Merge any locally-saved guest items on login
      const localIds   = getLocalIds();
      const localProds = getLocalProducts();
      if (localIds.length > 0) {
        for (const id of localIds) {
          if (!data.productIds?.includes(Number(id))) {
            await serverAdd(id, token);
          }
        }
        localStorage.removeItem(LOCAL_IDS_KEY);
        localStorage.removeItem(LOCAL_PRODS_KEY);
        // Reload after merge
        loadServerWishlist();
      }
    } catch (_) {
    } finally {
      setLoadingWishlist(false);
    }
  }

  // ── Local wishlist (guest) ─────────────────────────────────────────────
  function loadLocalWishlist() {
    const ids   = getLocalIds();
    const prods = getLocalProducts().map(normaliseProduct);
    setWishlistIds(new Set(ids));
    setProducts(prods);
  }

  // ── Normalise a product object so price is always a number ────────────
  function normaliseProduct(p) {
    return {
      ...p,
      price: p.price !== undefined && p.price !== null ? Number(p.price) : 0,
    };
  }

  // ── LocalStorage helpers ───────────────────────────────────────────────
  function getLocalIds() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_IDS_KEY) || '[]').map(String);
    } catch {
      return [];
    }
  }

  function getLocalProducts() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_PRODS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveLocalIds(ids) {
    localStorage.setItem(LOCAL_IDS_KEY, JSON.stringify([...ids]));
  }

  function saveLocalProducts(prods) {
    localStorage.setItem(LOCAL_PRODS_KEY, JSON.stringify(prods));
  }

  // ── Server helpers ─────────────────────────────────────────────────────
  async function serverAdd(productId, jwt) {
    try {
      await fetch(`${API_URL}/wishlist/${productId}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } catch (_) {}
  }

  async function serverRemove(productId, jwt) {
    try {
      await fetch(`${API_URL}/wishlist/${productId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } catch (_) {}
  }

  // ── toggleWishlist ─────────────────────────────────────────────────────
  const toggleWishlist = useCallback(async (productId, productObj) => {
    const id = String(productId);
    const alreadyIn = wishlistIds.has(id);

    // Optimistic update of IDs
    setWishlistIds(prev => {
      const next = new Set(prev);
      alreadyIn ? next.delete(id) : next.add(id);
      if (!isLoggedIn) saveLocalIds(next);
      return next;
    });

    // Optimistic update of products list
    if (!alreadyIn && productObj) {
      const normalised = normaliseProduct(productObj);
      setProducts(prev => {
        const next = prev.some(p => String(p.id) === id) ? prev : [...prev, normalised];
        if (!isLoggedIn) saveLocalProducts(next);
        return next;
      });
    }
    if (alreadyIn) {
      setProducts(prev => {
        const next = prev.filter(p => String(p.id) !== id);
        if (!isLoggedIn) saveLocalProducts(next);
        return next;
      });
    }

    // Persist to server or localStorage
    if (isLoggedIn && token) {
      alreadyIn ? await serverRemove(id, token) : await serverAdd(id, token);
    }
  }, [wishlistIds, isLoggedIn, token]);

  const isWishlisted = useCallback((productId) => wishlistIds.has(String(productId)), [wishlistIds]);

  return (
    <WishlistContext.Provider value={{
      wishlistIds,
      products,
      wishlistCount: wishlistIds.size,
      loadingWishlist,
      toggleWishlist,
      isWishlisted,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
