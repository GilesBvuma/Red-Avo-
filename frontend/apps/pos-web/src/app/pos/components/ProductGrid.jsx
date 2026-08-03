'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import StatsBar from './StatsBar';
import { fetchProducts, fetchDashboardStats, fetchStockLevels, fetchCategories } from '../lib/api';
import { useAuth } from '../../AuthProvider';

/* ── Shared colour palette for variant swatches ── */
const COLOR_MAP = {
  'Crimson Red':  '#C0392B', 'Matte Black':  '#1A1A1A', 'Soft White':    '#FAFAF5',
  'Blush Pink':   '#F4A0A0', 'Forest Green': '#2D6A4F', 'Navy Blue':     '#1B3A6B',
  'Teal':         '#0D9488', 'Burgundy':     '#800020', 'Mustard':       '#FFDB58',
  'Olive':        '#808000', 'Charcoal':     '#36454F', 'Peach':         '#FFE5B4',
  'Mint Green':   '#98FF98', 'Coral':        '#FF7F50', 'Lilac':         '#C8A2C8',
  'Slate Blue':   '#6A5ACD', 'Rose Gold':    '#B76E79', 'Taupe':         '#483C32',
  'Chocolate':    '#7B3F00', 'Plum':         '#8E4585', 'Rust':          '#B7410E',
  'Sand':         '#C2B280', 'Hot Pink':     '#FF10F0', 'Neon Green':    '#39FF14',
  'Electric Blue':'#7DF9FF', 'Red':          '#ff1010', 'Black':         '#1A1A1A',
  'White':        '#F5F5F5', 'Pink':         '#FFC0CB', 'Blue':          '#2196F3',
  'Green':        '#4CAF50', 'Grey':         '#9E9E9E', 'Purple':        '#9C27B0',
};

const getColorHex = (name) => {
  if (!name) return '#9ca3af';
  // Try exact match first, then case-insensitive
  return COLOR_MAP[name] || COLOR_MAP[Object.keys(COLOR_MAP).find(k => k.toLowerCase() === name.toLowerCase())] || '#9ca3af';
};

export default function ProductGrid({ cart, onAdd, onIncrease, onDecrease }) {
  const { user } = useAuth();
  const [products, setProducts]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [category, setCategory]       = useState('All');
  const [search, setSearch]           = useState('');
  const [stats, setStats]             = useState(null);
  const [loadingProducts, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError]             = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* Variant modal state */
  const [modalQty,        setModalQty]        = useState(1);
  const [modalSize,       setModalSize]       = useState(null);
  const [modalColor,      setModalColor]      = useState(null);

  const parseDate = (d) => {
    if (!d) return 0;
    if (Array.isArray(d)) {
      return new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0, d[5] || 0).getTime();
    }
    return new Date(d).getTime();
  };

  // Fetch products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let [data, stockData, cats] = await Promise.all([
        fetchProducts(),
        user?.role !== 'ADMIN' && user?.storeId ? fetchStockLevels(user.storeId) : Promise.resolve(null),
        fetchCategories()
      ]);

      if (stockData) {
        const stockMap = {};
        stockData.forEach(sl => {
            if (sl.variant && sl.variant.id) {
                stockMap[sl.variant.id] = sl.quantity;
            }
        });
        
        data = data.map(p => {
           if (!p.variants || p.variants.length === 0) return p;
           const updatedVariants = p.variants.map(v => ({
               ...v,
               stockQuantity: stockMap[v.id] || 0
           }));
           const totalLocalStock = updatedVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
           return {
               ...p,
               variants: updatedVariants,
               stockQuantity: totalLocalStock
           };
        }).filter(p => p.stockQuantity > 0);
      }

      setProducts(data);
      setFiltered(data);
      if (cats) setCategories(cats);
    } catch (e) {
      setError('Could not load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.storeId]);

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch {
      // stats are non-critical
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadProducts, loadStats]);

  // Filter by category + search
  useEffect(() => {
    let result = products;
    if (category !== 'All') {
      result = result.filter((p) => p.category && p.category.toLowerCase() === category.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => parseDate(b.updatedAt || b.createdAt) - parseDate(a.updatedAt || a.createdAt));
    setFiltered(result);
  }, [products, category, search]);

  const getCartQty = (productId) => {
    return cart
      .filter((c) => c.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const openVariantModal = (product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setModalSize(null);
    setModalColor(null);
  };

  const handleProductAddClick = (product) => {
    if (product.variants && product.variants.length > 0) {
      openVariantModal(product);
    } else {
      onAdd(product, null);
    }
  };

  /* Derived variant data for the modal */
  const modalVariants   = selectedProduct?.variants || [];
  const availableSizes  = [...new Set(modalVariants.map(v => v.size).filter(Boolean))];
  const availableColors = modalSize
    ? [...new Set(modalVariants.filter(v => v.size === modalSize && v.stockQuantity > 0).map(v => v.color).filter(Boolean))]
    : [...new Set(modalVariants.map(v => v.color).filter(Boolean))];
  const selectedVariant = modalSize && modalColor
    ? modalVariants.find(v => v.size === modalSize && v.color === modalColor)
    : null;
  const stockLimit = selectedVariant ? selectedVariant.stockQuantity : 999;

  const handleConfirmVariant = () => {
    if (!selectedVariant) return;
    // Add once (quantity 1) then increase for the rest
    onAdd(selectedProduct, selectedVariant);
    for (let i = 1; i < modalQty; i++) {
      onIncrease(`v-${selectedVariant.id}`);
    }
    setSelectedProduct(null);
  };

  return (
    <>
      <StatsBar stats={stats} loading={loadingStats} />

      {/* Toolbar */}
      <div className="pos-toolbar">
        <div className="pos-search-row">
          <div className="pos-search-wrap">
            <span className="pos-search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              id="pos-search-input"
              type="search"
              className="pos-search-input"
              placeholder="Search products here..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>
          <button
            className="pos-filter-btn"
            id="pos-filter-btn"
            aria-label="Filter and sort products"
            title="Filter / Sort"
            onClick={() => setSearch('')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>
          <div style={{ marginBottom: 16 }}>
        <CategoryTabs categories={categories} activeCategory={category} onCategoryChange={setCategory} />
      </div>
      </div>

      {/* Product grid */}
      <div className="pos-product-area">
        {loadingProducts ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px' }}>
            <div className="pos-loading-spinner" />
            <span style={{ fontSize: '13px', color: 'var(--pos-text-muted)' }}>Loading products...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--pos-text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--pos-text)' }}>Backend Offline</div>
            <div style={{ fontSize: '12.5px', marginBottom: '16px' }}>{error}</div>
            <button
              className="pos-add-btn"
              style={{ maxWidth: '160px', margin: '0 auto' }}
              onClick={loadProducts}
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--pos-text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontWeight: 600 }}>No products found</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Try a different search or category</div>
          </div>
        ) : (
          <div className="pos-product-grid" role="list" aria-label="Product list">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQty={getCartQty(product.id)}
                onAdd={handleProductAddClick}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Variant Selection Modal ── */}
      {selectedProduct && (
        <div className="pos-variant-overlay" onClick={() => setSelectedProduct(null)}>
          <div
            className="pos-variant-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Select variant for ${selectedProduct.name}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pos-variant-modal-header">
              <div>
                <p className="pos-variant-modal-title">{selectedProduct.name}</p>
                <p className="pos-variant-modal-sub">Select size, colour &amp; quantity</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="pos-variant-modal-price">${selectedProduct.price.toFixed(2)}</span>
                <button
                  className="pos-variant-modal-close"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="pos-variant-divider" style={{ marginTop: '16px' }} />

            <div className="pos-variant-modal-body">

              {/* Size selection */}
              {availableSizes.length > 0 && (
                <div>
                  <div className="pos-variant-section-label">Size</div>
                  <div className="pos-size-grid">
                    {availableSizes.map(size => {
                      const hasStock = modalVariants.some(v => v.size === size && v.stockQuantity > 0);
                      return (
                        <button
                          key={size}
                          disabled={!hasStock}
                          className={`pos-size-pill${modalSize === size ? ' selected' : ''}`}
                          onClick={() => { setModalSize(size); setModalColor(null); setModalQty(1); }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colour selection */}
              {availableColors.length > 0 && (
                <div>
                  <div className="pos-variant-section-label">
                    Colour{modalColor && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>— {modalColor}</span>}
                  </div>
                  <div className="pos-colour-grid">
                    {availableColors.map(color => {
                      const hex = getColorHex(color);
                      const isLight = ['#FAFAF5','#FFE5B4','#98FF98','#FFDB58','#F5F5F5','#FFC0CB'].includes(hex);
                      return (
                        <button
                          key={color}
                          title={color}
                          aria-label={color}
                          className={`pos-colour-swatch${modalColor === color ? ' selected' : ''}`}
                          onClick={() => { setModalColor(color); setModalQty(1); }}
                          style={{
                            background: hex,
                            border: isLight ? '1.5px solid #ccc' : '1.5px solid transparent',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock info for selected variant */}
              {selectedVariant && (
                <div className={`pos-stock-chip${selectedVariant.stockQuantity === 0 ? ' out' : selectedVariant.stockQuantity <= 5 ? ' low' : ''}`}>
                  {selectedVariant.stockQuantity === 0
                    ? '⚠️ Out of stock'
                    : selectedVariant.stockQuantity <= 5
                      ? `⚠️ Only ${selectedVariant.stockQuantity} left in stock`
                      : `✓ ${selectedVariant.stockQuantity} in stock`}
                </div>
              )}

              <div className="pos-variant-divider" />

              {/* Quantity selector */}
              <div>
                <div className="pos-variant-section-label">Quantity</div>
                <div className="pos-modal-qty-row">
                  <button
                    className="pos-modal-qty-btn"
                    onClick={() => setModalQty(q => Math.max(1, q - 1))}
                    disabled={modalQty <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="pos-modal-qty-value" aria-live="polite">{modalQty}</span>
                  <button
                    className="pos-modal-qty-btn"
                    onClick={() => setModalQty(q => Math.min(q + 1, stockLimit))}
                    disabled={modalQty >= stockLimit}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  {selectedVariant && (
                    <span className="pos-modal-qty-total">
                      = ${(selectedProduct.price * modalQty).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Confirm */}
              <button
                className="pos-variant-confirm-btn"
                disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
                onClick={handleConfirmVariant}
              >
                {!modalSize
                  ? 'Select a size first'
                  : !modalColor
                    ? 'Select a colour'
                    : selectedVariant?.stockQuantity === 0
                      ? 'Out of Stock'
                      : `Add ${modalQty} to Order — $${(selectedProduct.price * modalQty).toFixed(2)}`}
              </button>

            </div>
          </div>
        </div>
      )}

    </>
  );
}
