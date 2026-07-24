'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Sidebar, { NAV_ITEMS, NavItem } from './components/Sidebar';
import ProductGrid from './components/ProductGrid';
import OrderPanel from './components/OrderPanel';
import ActiveOrdersBar from './components/ActiveOrdersBar';
import StockManagementPage from './components/StockManagementPage';
import CustomersPage from './components/CustomersPage';
import TransfersPage from './components/TransfersPage';
import BusinessManagementPage from './components/BusinessManagementPage';
import FinancialsPage from './components/FinancialsPage';
import OrdersPage from './components/OrdersPage';
import MarketingPage from './components/MarketingPage';
import { NotificationToast } from './components/NotificationToast';
import { useAuth } from '../AuthProvider';

// ── Toast hook ────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
}

// ── Cart helpers ─────────────────────────────────────────────────
function getCartItemKey(product, variant) {
  return variant ? `v-${variant.id}` : `p-${product.id}`;
}
function getItemKey(item) {
  return getCartItemKey(item.product, item.variant);
}
function addToCart(cart, product, variant = null) {
  const itemKey = getCartItemKey(product, variant);
  const existing = cart.find((i) => getItemKey(i) === itemKey);
  const stockLimit = variant ? variant.stockQuantity : product.stockQuantity;
  if (existing) {
    return cart.map((i) =>
      getItemKey(i) === itemKey ? { ...i, quantity: Math.min(i.quantity + 1, stockLimit) } : i
    );
  }
  return [...cart, { product, variant, quantity: 1 }];
}
function increaseQty(cart, itemKey) {
  return cart.map((i) => {
    if (getItemKey(i) === itemKey) {
      const stockLimit = i.variant ? i.variant.stockQuantity : i.product.stockQuantity;
      return { ...i, quantity: Math.min(i.quantity + 1, stockLimit) };
    }
    return i;
  });
}
function decreaseQty(cart, itemKey) {
  const item = cart.find((i) => getItemKey(i) === itemKey);
  if (!item) return cart;
  if (item.quantity <= 1) return cart.filter((i) => getItemKey(i) !== itemKey);
  return cart.map((i) => getItemKey(i) === itemKey ? { ...i, quantity: i.quantity - 1 } : i);
}
function removeFromCart(cart, itemKey) {
  return cart.filter((i) => getItemKey(i) !== itemKey);
}

// ── Mobile Drawer component ───────────────────────────────────────
function MobileDrawer({ activeNav, onNavChange, onClose, user, logout }) {
  const visibleNavItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );
  const mainItems       = visibleNavItems.slice(0, 3);
  const managementItems = visibleNavItems.slice(3);

  const handleNavChange = (id) => {
    onNavChange(id);
    onClose();
  };

  return (
    <div className="pos-mobile-drawer-overlay" onClick={onClose}>
      <div className="pos-mobile-drawer" onClick={e => e.stopPropagation()}>
        <div className="pos-mobile-drawer-header">
          <Image src="/images/logo.png" alt="Red Avo" width={90} height={40} style={{ objectFit: 'contain', width: 'auto', height: 40 }} priority />
          <button className="pos-mobile-drawer-close" onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <div className="pos-mobile-drawer-user">
          <div className="pos-staff-avatar">{(user?.name || user?.email || '?')[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{user?.name || user?.email}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{user?.role === 'ADMIN' ? 'Admin' : 'Cashier'}</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div className="pos-nav-section">Main</div>
          {mainItems.map(item => (
            <NavItem key={item.id} item={item} isActive={activeNav === item.id} onClick={() => handleNavChange(item.id)} />
          ))}
          {managementItems.length > 0 && (
            <>
              <div className="pos-nav-section">Management</div>
              {managementItems.map(item => (
                <NavItem key={item.id} item={item} isActive={activeNav === item.id} onClick={() => handleNavChange(item.id)} />
              ))}
            </>
          )}
        </nav>

        <div style={{ padding: '16px' }}>
          <button className="pos-logout-btn" onClick={logout} style={{ width: '100%' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main POS Page ────────────────────────────────────────────────
export default function POSPage() {
  const [activeNav, setActiveNav] = useState('menu');
  const [cart, setCart]           = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();
  const { user, logout } = useAuth();

  const handleAdd      = useCallback((p, v) => setCart((c) => addToCart(c, p, v)), []);
  const handleIncrease = useCallback((itemKey) => setCart((c) => increaseQty(c, itemKey)), []);
  const handleDecrease = useCallback((itemKey) => setCart((c) => decreaseQty(c, itemKey)), []);
  const handleRemove   = useCallback((itemKey) => setCart((c) => removeFromCart(c, itemKey)), []);
  const handleClear    = useCallback(() => setCart([]), []);

  const visibleNavItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Toast notifications */}
      <NotificationToast toasts={toasts} onRemove={removeToast} />

      {/* ── Desktop Sidebar (hidden on mobile via CSS) ── */}
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

      {/* ── Mobile Top Header (hidden on desktop via CSS) ── */}
      <div className="pos-mobile-header">
        <Image src="/images/logo.png" alt="Red Avo" width={80} height={36} style={{ objectFit: 'contain', width: 'auto', height: 36 }} priority />
        <button className="pos-mobile-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="pos-main">
        {activeNav === 'menu' && (
          <div className="pos-center" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <ProductGrid cart={cart} onAdd={handleAdd} onIncrease={handleIncrease} onDecrease={handleDecrease} />
            <ActiveOrdersBar />
          </div>
        )}
        {activeNav === 'stock'      && <StockManagementPage />}
        {activeNav === 'customers'  && <CustomersPage />}
        {activeNav === 'transfers'  && <TransfersPage />}
        {activeNav === 'settings'   && <BusinessManagementPage />}
        {activeNav === 'financials' && <FinancialsPage />}
        {activeNav === 'orders'     && <OrdersPage />}
        {activeNav === 'marketing'  && <MarketingPage />}
      </div>

      {/* ── Order panel ── */}
      {activeNav === 'menu' && cart.length > 0 && (
        <OrderPanel
          cart={cart}
          onRemoveItem={handleRemove}
          onClearCart={handleClear}
          onToast={addToast}
        />
      )}

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <MobileDrawer
          activeNav={activeNav}
          onNavChange={setActiveNav}
          onClose={() => setDrawerOpen(false)}
          user={user}
          logout={logout}
        />
      )}
    </>
  );
}
