'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { login, setAuthToken, clearAuthToken } from '@red-avo/api-client';

const AuthContext = createContext();

/**
 * Decodes the JWT payload (middle segment) and returns true if the token
 * is still valid (exp is in the future). Returns false if expired or malformed.
 * Uses atob — no external jwt library needed.
 */
function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds; Date.now() is in milliseconds
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in and token is not expired
    const token = sessionStorage.getItem('redavo_token');
    const userData = sessionStorage.getItem('redavo_user');

    if (token && userData) {
      if (isTokenValid(token)) {
        setAuthToken(token);
        // Parse preserves the stored name/email/role structure set at login
        setUser(JSON.parse(userData));
      } else {
        // Token has expired — clear stale session to avoid 401 loops
        sessionStorage.removeItem('redavo_token');
        sessionStorage.removeItem('redavo_user');
        clearAuthToken();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Route guard
    if (!loading) {
      if (!user && !pathname.startsWith('/auth')) {
        router.push('/auth/role-select');
      } else if (user && pathname.startsWith('/auth')) {
        router.push('/pos');
      }
    }
  }, [user, loading, pathname, router]);

  const handleLogin = async (email, password) => {
    const res = await login(email, password);
    setAuthToken(res.token);

    const userData = {
      // Gap #12 FIX: store name and email separately so Sidebar shows full name,
      // not the email address when fullName is set on the user account.
      name:    res.name    || null,
      email:   res.email,
      role:    res.role,
      storeId: res.storeId,
      // 'username' kept for backwards compat with any component still using it
      username: res.name || res.email,
    };

    sessionStorage.setItem('redavo_token', res.token);
    sessionStorage.setItem('redavo_user', JSON.stringify(userData));
    setUser(userData);

    // Route by role — extend this switch when new dashboards are added
    if (res.role === 'ADMIN') {
      router.push('/pos');
    } else if (res.role === 'EMPLOYEE') {
      router.push('/pos');
    } else {
      router.push('/pos');
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    sessionStorage.removeItem('redavo_token');
    sessionStorage.removeItem('redavo_user');
    setUser(null);
    router.push('/auth/role-select');
  };

  if (loading) return null; // or a loading spinner

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
