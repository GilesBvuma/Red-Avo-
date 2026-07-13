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
function addToCart(cart, product) {
  const existing = cart.find((i) => i.product.id === product.id);
  if (existing) {
    return cart.map((i) =>
      i.product.id === product.id
        ? { ...i, quantity: Math.min(i.quantity + 1, product.stockQuantity) }
        : i
    );
  }
  return [...cart, { product, quantity: 1 }];
}

function increaseQty(cart, product) {
  return cart.map((i) =>
    i.product.id === product.id
      ? { ...i, quantity: Math.min(i.quantity + 1, product.stockQuantity) }
      : i
  );
}

function decreaseQty(cart, product) {
  const item = cart.find((i) => i.product.id === product.id);
  if (!item) return cart;
  if (item.quantity <= 1) return cart.filter((i) => i.product.id !== product.id);
  return cart.map((i) =>
    i.product.id === product.id ? { ...i, quantity: i.quantity - 1 } : i
  );
}

function removeFromCart(cart, productId) {
  return cart.filter((i) => i.product.id !== productId);
}

// ── Main POS Page ────────────────────────────────────────────────
export default function POSPage() {
  const [activeNav, setActiveNav] = useState('menu');
  const [cart, setCart]           = useState([]);
  const { toasts, addToast, removeToast } = useToasts();

  const handleAdd      = useCallback((p) => setCart((c) => addToCart(c, p)),    []);
  const handleIncrease = useCallback((p) => setCart((c) => increaseQty(c, p)),  []);
  const handleDecrease = useCallback((p) => setCart((c) => decreaseQty(c, p)),  []);
  const handleRemove   = useCallback((id) => setCart((c) => removeFromCart(c, id)), []);
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
