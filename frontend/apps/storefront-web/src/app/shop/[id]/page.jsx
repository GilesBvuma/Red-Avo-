'use client';

import React, { useState, useEffect, use } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { fetchProduct, API_URL } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import ProductReviews from '@/components/Reviews/ProductReviews';
import styles from './product.module.css';

/* ─── Colour map for swatches ─── */
const COLOR_MAP = {
  'Crimson Red': '#C0392B', 'Matte Black': '#1A1A1A', 'Soft White': '#FAFAF5',
  'Blush Pink': '#F4A0A0', 'Forest Green': '#2D6A4F', 'Navy Blue': '#1B3A6B',
  'Teal': '#0D9488', 'Burgundy': '#800020', 'Mustard': '#FFDB58',
  'Olive': '#808000', 'Charcoal': '#36454F', 'Peach': '#FFE5B4',
  'Mint Green': '#98FF98', 'Coral': '#FF7F50', 'Lilac': '#C8A2C8',
  'Slate Blue': '#6A5ACD', 'Rose Gold': '#B76E79', 'Taupe': '#483C32',
  'Chocolate': '#7B3F00', 'Plum': '#8E4585', 'Rust': '#B7410E',
  'Sand': '#C2B280', 'Hot Pink': '#FF10F0', 'Neon Green': '#39FF14',
  'Electric Blue': '#7DF9FF', 'Red': '#ff1010',
};
const getColorHex = (name) => COLOR_MAP[name] || '#9ca3af';

export default function ProductPage({ params }) {
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [reviewSummary, setReviewSummary] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchProduct(id);
        setProduct(data);
        
        // Fetch review summary too
        fetch(`${API_URL}/products/${id}/reviews/summary`)
          .then(res => {
            if (!res.ok) throw new Error('Reviews not found');
            return res.json();
          })
          .then(summaryData => setReviewSummary(summaryData))
          .catch(() => setReviewSummary(null));
          
      } catch (err) {
        console.error(err);
        setError('Failed to load product.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Nav />
        <div className={styles.main}>
          <div className={styles.loading}>Loading product details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.page}>
        <Nav />
        <div className={styles.main}>
          <div className={styles.loading}>{error || 'Product not found'}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Derive unique images
  const images = [];
  if (product.imageUrl) images.push(product.imageUrl);
  if (product.imageUrls) images.push(...product.imageUrls);
  const uniqueImages = Array.from(new Set(images));
  if (uniqueImages.length === 0) {
    uniqueImages.push('https://placehold.co/800x1000?text=No+Image');
  }

  // Variants and options
  const variants = product.variants || [];
  const allSizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
  const allColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
  
  const availForSize = selectedSize
    ? variants.filter(v => v.size === selectedSize && v.stockQuantity > 0).map(v => v.color)
    : [];
    
  const selectedVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);

  const handleAddToCart = () => {
    if (product && selectedVariant) {
      addToCart(product, selectedVariant, 1);
      // Optional: show a mini-cart overlay or toast notification
    }
  };

  return (
    <div className={styles.page}>
      <Nav />

      <main className={styles.main}>
        <div className={styles.container}>
          
          {/* ── Left side: Stacked Images ── */}
          <div className={styles.imageSection}>
            {uniqueImages.map((src, i) => (
              <div key={i} className={styles.imageWrap}>
                <img
                  src={`${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${src}`}
                  alt={`${product.name} - view ${i + 1}`}
                  className={styles.image}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          {/* ── Right side: Sticky Info ── */}
          <div className={styles.infoSection}>
            <nav className={styles.breadcrumb}>
              <a href="/">Home</a> › 
              <a href="/shop">Shop</a> › 
              <span>{product.name}</span>
            </nav>

            <h1 className={styles.title}>{product.name}</h1>
            
            <div className={styles.priceRow}>
              <span className={styles.price}>${product.price?.toFixed(2)}</span>
              {reviewSummary && reviewSummary.totalReviews > 0 && (
                <div className={styles.reviewSummary}>
                  <span className={styles.star}>★</span>
                  <span>{reviewSummary.averageRating}</span>
                  <span className={styles.reviewCount} onClick={() => document.getElementById('reviews-section').scrollIntoView({ behavior: 'smooth' })}>
                    ({reviewSummary.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>

            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}

            <div className={styles.variants}>
              {allSizes.length > 0 && (
                <>
                  <span className={styles.variantLabel}>Size</span>
                  <div className={styles.sizeGrid}>
                    {allSizes.map(size => {
                      const inStock = variants.some(v => v.size === size && v.stockQuantity > 0);
                      return (
                        <button
                          key={size}
                          className={`${styles.sizeBtn} ${selectedSize === size ? styles.selected : ''} ${!inStock ? styles.disabled : ''}`}
                          onClick={() => {
                            if (!inStock) return;
                            setSelectedSize(size);
                            if (selectedColor && !variants.some(v => v.size === size && v.color === selectedColor && v.stockQuantity > 0)) {
                              setSelectedColor(null);
                            }
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {allColors.length > 0 && (
                <>
                  <span className={styles.variantLabel}>
                    Color {selectedColor ? `- ${selectedColor}` : ''}
                  </span>
                  <div className={styles.colorGrid}>
                    {allColors.map(color => {
                      const available = selectedSize
                        ? availForSize.includes(color)
                        : variants.some(v => v.color === color && v.stockQuantity > 0);
                      return (
                        <button
                          key={color}
                          title={color}
                          className={`${styles.colorBtn} ${selectedColor === color ? styles.selected : ''} ${!available ? styles.disabled : ''}`}
                          style={{ background: getColorHex(color) }}
                          onClick={() => {
                            if (available) setSelectedColor(color);
                          }}
                          aria-label={color}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {selectedVariant && (
                <div className={styles.stockStatus}>
                  <span>✓</span> {selectedVariant.stockQuantity} in stock
                </div>
              )}
            </div>

            <button
              className={styles.addToCartBtn}
              disabled={!selectedVariant || selectedVariant.stockQuantity <= 0}
              onClick={handleAddToCart}
            >
              {selectedVariant ? 'Add to Bag' : 'Select Size & Color'}
            </button>


          </div>
        </div>

        {/* ── Reviews Section ── */}
        <div id="reviews-section" className={styles.reviewsWrapper}>
          <ProductReviews productId={product.id} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
