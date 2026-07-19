'use client';

import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ProductGrid from './components/ProductGrid';
import OrderPanel from './components/OrderPanel';
import ActiveOrdersBar from './components/ActiveOrdersBar';
import ChannelStatusBar from './components/ChannelStatusBar';
import StockManagementPage from './components/StockManagementPage';
import CustomersPage from './components/CustomersPage';
import TransfersPage from './components/TransfersPage';
import BusinessManagementPage from './components/BusinessManagementPage';
import FinancialsPage from './components/FinancialsPage';
import OrdersPage from './components/OrdersPage';
import MarketingPage from './components/MarketingPage';
import { NotificationToast } from './components/NotificationToast';

// ── Toast hook (inline to avoid require() in component) ──────────
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
      getItemKey(i) === itemKey
        ? { ...i, quantity: Math.min(i.quantity + 1, stockLimit) }
        : i
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
  return cart.map((i) =>
    getItemKey(i) === itemKey ? { ...i, quantity: i.quantity - 1 } : i
  );
}

function removeFromCart(cart, itemKey) {
  return cart.filter((i) => getItemKey(i) !== itemKey);
}

// ── Main POS Page ────────────────────────────────────────────────
export default function POSPage() {
  const [activeNav, setActiveNav] = useState('menu');
  const [cart, setCart]           = useState([]);
  const { toasts, addToast, removeToast } = useToasts();

  const handleAdd      = useCallback((p, v) => setCart((c) => addToCart(c, p, v)), []);
  const handleIncrease = useCallback((itemKey) => setCart((c) => increaseQty(c, itemKey)), []);
  const handleDecrease = useCallback((itemKey) => setCart((c) => decreaseQty(c, itemKey)), []);
  const handleRemove   = useCallback((itemKey) => setCart((c) => removeFromCart(c, itemKey)), []);
  const handleClear    = useCallback(() => setCart([]), []);

  return (
    <>
      {/* Toast notifications */}
      <NotificationToast toasts={toasts} onRemove={removeToast} />

      {/* Sidebar */}
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />

      {/* Main content — center + right */}
      <div className="pos-main">
        {/* Channel status ribbon */}
        <ChannelStatusBar />

        {/* Center — Main area */}
        {activeNav === 'menu' && (
          <div className="pos-center" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <ProductGrid
              cart={cart}
              onAdd={handleAdd}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
            />

            {/* Active orders strip at bottom */}
            <ActiveOrdersBar />
          </div>
        )}
        
        {activeNav === 'stock' && <StockManagementPage />}
        {activeNav === 'customers' && <CustomersPage />}
        {activeNav === 'transfers' && <TransfersPage />}
        {activeNav === 'settings' && <BusinessManagementPage />}
        {activeNav === 'financials' && <FinancialsPage />}
        {activeNav === 'orders' && <OrdersPage />}
        {activeNav === 'marketing' && <MarketingPage />}
      </div>

      {/* Right — Order panel */}
      {activeNav === 'menu' && (
        <OrderPanel
          cart={cart}
          onRemoveItem={handleRemove}
          onClearCart={handleClear}
          onToast={addToast}
        />
      )}
    </>
  );
}
