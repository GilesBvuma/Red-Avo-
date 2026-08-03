'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../../AuthProvider';
import * as api from '../lib/api';

export const NAV_ITEMS = [
  {
    id: 'menu',
    label: 'Menu / Products',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    id: 'gift-cards',
    label: 'Gift Cards',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    id: 'marketing',
    label: 'Marketing & Comms',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 0-7.07 17.07l.07.07 1.41-1.41A8 8 0 1 1 12 4v-2z"/>
        <path d="M12 22a10 10 0 0 0 7.07-17.07l-.07-.07-1.41 1.41A8 8 0 1 1 12 20v2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    roles: ['ADMIN'],
  },
  {
    id: 'stock',
    label: 'Stock Management',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    id: 'financials',
    label: 'Financials',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    roles: ['ADMIN'],
  },
  {
    id: 'settings',
    label: 'Business Management',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    roles: ['ADMIN'],
  },
  {
    id: 'transfers',
    label: 'Transfers',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3v18" /><path d="M10 21 3 14l7-7" /><path d="M14 10l7 7-7 7" /><path d="M7 21V3" />
      </svg>
    ),
    roles: ['ADMIN', 'EMPLOYEE'],
  },
];

// Desktop sidebar only — mobile nav is handled in page.jsx
export default function Sidebar({ activeNav, onNavChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const [storeName, setStoreName] = useState(null);

  useEffect(() => {
    if (!user?.storeId) return;
    api.fetchStores()
      .then(stores => {
        const found = stores.find(s => s.id === user.storeId);
        if (found) setStoreName(found.name);
      })
      .catch(() => {});
  }, [user?.storeId]);

  const storeLabel  = storeName || (user?.storeId ? `Store #${user.storeId}` : 'All Stores');
  const displayName = user?.name || user?.email || 'Unknown';
  const avatarLetter = displayName[0].toUpperCase();

  const visibleNavItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );
  const mainItems       = visibleNavItems.slice(0, 3);
  const managementItems = visibleNavItems.slice(3);

  return (
    <aside className={`pos-sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="POS Navigation">
      {/* Header: Logo and Toggle */}
      <div className="pos-logo" style={{ 
        padding: isCollapsed ? '20px 0' : '20px 20px', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        flexDirection: isCollapsed ? 'column' : 'row',
        gap: isCollapsed ? '16px' : '12px',
        alignItems: 'center'
      }}>
        <div className="pos-logo-icon" aria-hidden="true" style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', flex: isCollapsed ? 'none' : 1 }}>
          <Image 
            src="/images/logo.png" 
            alt="Red Avo Logo" 
            width={isCollapsed ? 40 : 120} 
            height={isCollapsed ? 40 : 56} 
            style={{ objectFit: 'contain', width: 'auto', height: 'auto' }} 
            priority
          />
        </div>
        <button 
          className="pos-sidebar-toggle" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="pos-nav" aria-label="Main navigation">
        {!isCollapsed && <div className="pos-nav-section">Main</div>}
        {mainItems.map((item) => (
          <NavItem key={item.id} item={item} isActive={activeNav === item.id} onClick={() => onNavChange(item.id)} />
        ))}
        {managementItems.length > 0 && (
          <>
            {!isCollapsed && <div className="pos-nav-section">Management</div>}
            {managementItems.map((item) => (
              <NavItem key={item.id} item={item} isActive={activeNav === item.id} onClick={() => onNavChange(item.id)} />
            ))}
          </>
        )}
      </nav>

      {/* Staff footer */}
      <div className="pos-sidebar-footer" style={{ padding: isCollapsed ? '16px 8px' : '24px' }}>
        {!isCollapsed ? (
          <>
            <div className="pos-staff-card" role="status">
              <div className="pos-staff-avatar">{avatarLetter}</div>
              <div className="pos-staff-info">
                <div className="pos-staff-name">{displayName}</div>
                <div className="pos-staff-role">{user?.role === 'ADMIN' ? 'Admin' : 'Cashier'} · {storeLabel}</div>
              </div>
            </div>
            <button className="pos-logout-btn" id="pos-logout-btn" onClick={logout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Log Out</span>
            </button>
          </>
        ) : (
          <div className="pos-staff-avatar" style={{ margin: '0 auto', width: 32, height: 32, fontSize: 12 }}>
            {avatarLetter}
          </div>
        )}
      </div>
    </aside>
  );
}

export function NavItem({ item, isActive, onClick }) {
  return (
    <button
      id={`pos-nav-${item.id}`}
      className={`pos-nav-item${isActive ? ' active' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="pos-nav-icon" aria-hidden="true">{item.icon}</span>
      <span className="pos-nav-label">{item.label}</span>
      {item.badge && <span className="pos-nav-badge">{item.badge}</span>}
    </button>
  );
}
