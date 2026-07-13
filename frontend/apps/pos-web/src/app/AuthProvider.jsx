'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { login, setAuthToken, clearAuthToken } from '@red-avo/api-client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('redavo_token');
    const userData = localStorage.getItem('redavo_user');
    
    if (token && userData) {
      setAuthToken(token);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Route guard
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/pos');
      }
    }
  }, [user, loading, pathname, router]);

  const handleLogin = async (username, password) => {
    const res = await login(username, password);
    setAuthToken(res.token);
    
    const userData = {
      username: res.username,
      role: res.role,
      storeId: res.storeId
    };
    
    localStorage.setItem('redavo_token', res.token);
    localStorage.setItem('redavo_user', JSON.stringify(userData));
    setUser(userData);
    router.push('/pos');
  };

  const handleLogout = () => {
    clearAuthToken();
    localStorage.removeItem('redavo_token');
    localStorage.removeItem('redavo_user');
    setUser(null);
    router.push('/login');
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
