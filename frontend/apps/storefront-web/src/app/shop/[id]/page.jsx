'use client';

import React, { useState, useEffect, use } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { fetchProduct, fetchColors, API_URL } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import ProductReviews from '@/components/Reviews/ProductReviews';
import styles from './product.module.css';


// Always use relative /uploads/ path to bypass Next.js private-IP protection
function toRelative(url) {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return url;
  const idx = url.indexOf('/uploads/');
  if (idx !== -1) return url.slice(idx);
  return url;
}

/** Size tokens — values that must never appear as colour swatches or colour selectors */
const SIZE_TOKEN_RE = /^(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|XXXL|ONE\s*SIZE|ONESIZE|FREE\s*SIZE|STANDARD)$/i;

/**
 * Resolves a colour name to a hex code using the DB colour map.
 * Returns null for size tokens, gift-card prices, or unknown names.
 */
function resolveHex(name, colorMap) {
  if (!name || !colorMap) return null;
  const trimmed = name.trim();
  if (SIZE_TOKEN_RE.test(trimmed) || trimmed.startsWith('$')) return null;
  const lowerName = trimmed.toLowerCase();
  if (colorMap[trimmed]) return colorMap[trimmed];
  const dbMatch = Object.entries(colorMap).find(([k]) => k.toLowerCase() === lowerName);
  return dbMatch ? dbMatch[1] : null;
}

export default function ProductPage({ params }) {
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [colorMap, setColorMap] = useState({});
  
  const [reviewSummary, setReviewSummary] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [data, colorData] = await Promise.all([
          fetchProduct(id),
          fetchColors(),
        ]);
        setProduct(data);
        const map = {};
        if (Array.isArray(colorData)) colorData.forEach(c => { map[c.name] = c.hexCode; });
        setColorMap(map);
        
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

  // Variants and options — sanitized to prevent swapped color/size from showing incorrectly
  const variants = product.variants || [];
  // Only include canonical size tokens in the size selector
  const allSizes = Array.from(new Set(
    variants.map(v => v.size).filter(s => s && SIZE_TOKEN_RE.test(s.trim()))
  ));
  // Only include values that resolve to a valid colour hex (excludes sizes, $prices, unknown)
  const allColors = Array.from(new Set(
    variants.map(v => v.color).filter(c => c && Boolean(resolveHex(c, colorMap)))
  ));

  const getColorHex = (name) => resolveHex(name, colorMap) || '#9ca3af';
  
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

  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} by RedAvo Activewear`,
    image: uniqueImages.map(src => {
      const rel = toRelative(src);
      return rel ? `https://redavowear.com${rel}` : src;
    }).filter(Boolean),
    sku: product.sku || String(product.id),
    brand: {
      '@type': 'Brand',
      name: 'RedAvo Activewear',
    },
    offers: {
      '@type': 'Offer',
      url: `https://redavowear.com/shop/${product.id}`,
      priceCurrency: 'USD',
      price: (product.onSale && product.salePrice ? product.salePrice : product.price || 0).toFixed(2),
      availability: (product.stockQuantity > 0 || variants.some(v => v.stockQuantity > 0))
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(reviewSummary && reviewSummary.totalReviews > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewSummary.averageRating,
        reviewCount: reviewSummary.totalReviews,
      },
    } : {}),
  } : null;

  return (
    <div className={styles.page}>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <Nav />

      <main className={styles.main}>
        <div className={styles.container}>
          
          {/* ── Left side: Stacked Images ── */}
          <div className={styles.imageSection}>
            {uniqueImages.map((src, i) => (
              <div key={i} className={styles.imageWrap}>
                <img
                  src={toRelative(src) || 'https://placehold.co/400x500?text=No+Image'}
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
              <a href="/">Home</a> / <a href="/shop">Shop</a> / <span>{product.name}</span>
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

            <div className={styles.guaranteeBadge}>
              <div className={styles.badgeItem}>
                30-Day Quality Guarantee
              </div>
              <div className={styles.badgeItem}>
                Secure Local Delivery
              </div>
              <div className={styles.badgeItem}>
                Safe & Secure Payments (PayNow / Cash)
              </div>
            </div>
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
