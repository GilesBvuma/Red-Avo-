'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryTabs from './CategoryTabs';
import ProductCard from './ProductCard';
import StatsBar from './StatsBar';
import { fetchProducts, fetchDashboardStats } from '../lib/api';

export default function ProductGrid({ cart, onAdd, onIncrease, onDecrease }) {
  const [products, setProducts]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [category, setCategory]       = useState('All');
  const [search, setSearch]           = useState('');
  const [stats, setStats]             = useState(null);
  const [loadingProducts, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError]             = useState(null);

  // Fetch products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
      setFiltered(data);
    } catch (e) {
      setError('Could not load products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

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
    const interval = setInterval(loadStats, 30000); // refresh stats every 30s
    return () => clearInterval(interval);
  }, [loadProducts, loadStats]);

  // Filter by category + search
  useEffect(() => {
    let result = products;
    if (category !== 'All') {
      result = result.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [products, category, search]);

  const getCartQty = (productId) => {
    const item = cart.find((c) => c.product.id === productId);
    return item ? item.quantity : 0;
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

        <CategoryTabs activeCategory={category} onCategoryChange={setCategory} />
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
                onAdd={onAdd}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
