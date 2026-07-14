'use client';

import React, { useState, useEffect } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { fetchProducts, fetchCategories } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from './shop.module.css';

function ShopContent() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Variant Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const { addToCart } = useCart();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    async function loadData() {
      try {
        const [prodData, catData] = await Promise.all([
          fetchProducts(),
          fetchCategories()
        ]);
        // Filter out products with 0 total stock if desired, but we let variants handle it
        setProducts(prodData);
        setCategories(catData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  let filteredProducts = activeCategory
    ? products.filter(p => p.categoryId === activeCategory)
    : products;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setSelectedVariant(null); // Reset selection
  };

  const handleAddToCart = () => {
    if (selectedProduct && selectedVariant) {
      addToCart(selectedProduct, selectedVariant, 1);
      setSelectedProduct(null); // close modal
      // Could show a toast here
    }
  };

  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Shop The Collection</h1>
          {searchQuery ? (
            <p>Showing search results for "{searchQuery}"</p>
          ) : (
            <p>Authentic activewear built for her motion.</p>
          )}
        </div>

        {/* Categories (hide if searching) */}
        {!searchQuery && (
          <div className={styles.categories}>
            <button 
              className={`${styles.catBtn} ${!activeCategory ? styles.active : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`${styles.catBtn} ${activeCategory === cat.id ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className={styles.loading}>Loading collection...</div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map(product => (
              <div key={product.id} className={styles.card} onClick={() => handleProductClick(product)}>
                <div className={styles.imageWrap}>
                  <img 
                    src={product.imageUrl ? `http://localhost:3000${product.imageUrl}` : 'https://placehold.co/400x500?text=No+Image'} 
                    alt={product.name} 
                    className={styles.image}
                  />
                  {product.stockQuantity <= 0 && <span className={styles.badge}>Sold Out</span>}
                </div>
                <div className={styles.info}>
                  <h3>{product.name}</h3>
                  <p className={styles.price}>${product.price?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedProduct(null)}>✕</button>
            <div className={styles.modalLayout}>
              <div className={styles.modalImage}>
                 <img 
                    src={selectedProduct.imageUrl ? `http://localhost:3000${selectedProduct.imageUrl}` : 'https://placehold.co/400x500?text=No+Image'} 
                    alt={selectedProduct.name} 
                  />
              </div>
              <div className={styles.modalDetails}>
                <h2>{selectedProduct.name}</h2>
                <p className={styles.modalPrice}>${selectedProduct.price?.toFixed(2)}</p>
                <p className={styles.modalDesc}>{selectedProduct.description}</p>

                {selectedProduct.variants?.length > 0 ? (
                  <div className={styles.variants}>
                    <h4>Select Option</h4>
                    <div className={styles.variantList}>
                      {selectedProduct.variants.map(variant => {
                        const isOutOfStock = variant.stockQuantity <= 0;
                        return (
                          <button
                            key={variant.id}
                            disabled={isOutOfStock}
                            className={`${styles.variantBtn} ${selectedVariant?.id === variant.id ? styles.selected : ''} ${isOutOfStock ? styles.disabled : ''}`}
                            onClick={() => setSelectedVariant(variant)}
                          >
                            <span className={styles.vSku}>{variant.sku}</span>
                            <span className={styles.vLabel}>
                              {variant.color} - {variant.size}
                            </span>
                            {!isOutOfStock && <span className={styles.vStock}>{variant.stockQuantity} left</span>}
                            {isOutOfStock && <span className={styles.vStock}>Out of Stock</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className={styles.noVariants}>No options available for this product.</p>
                )}

                <button 
                  className={styles.addToCartBtn}
                  disabled={!selectedVariant || selectedVariant.stockQuantity <= 0}
                  onClick={handleAddToCart}
                >
                  {selectedVariant ? 'Add to Cart' : 'Select an Option'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.loading}>Loading...</div></div>}>
      <ShopContent />
    </Suspense>
  );
}
