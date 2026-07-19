'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { fetchProducts, fetchCategories } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import styles from './shop.module.css';

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

/* ─── Footer features data ─── */
const FEATURES = [
  { icon: '🚚', title: 'Fast Shipping', sub: 'Orders dispatched within 24h' },
  { icon: '✦',  title: 'Premium Materials', sub: 'Crafted for performance & feel' },
  { icon: '↩',  title: 'Easy Returns', sub: '30-day hassle-free returns' },
  { icon: '🔒', title: 'Secure Checkout', sub: 'End-to-end encrypted payments' },
];

/* ─── Sort options ─── */
const SORT_OPTIONS = [
  { value: 'default',   label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc',  label: 'Name A–Z' },
];

/* ============================================================
   ProductCard
   ============================================================ */
function ProductCard({ product, onClick, listView }) {
  const [imgIndex, setImgIndex] = useState(0);

  const images = [];
  if (product.imageUrl)  images.push(product.imageUrl);
  if (product.imageUrls) images.push(...product.imageUrls);
  const uniqueImages = Array.from(new Set(images));

  const variants  = product.variants || [];
  const colors    = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
  const isSoldOut = product.stockQuantity <= 0;

  const imgSrc = (i) =>
    uniqueImages.length > 0
      ? `${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${uniqueImages[i]}`
      : 'https://placehold.co/400x500?text=No+Image';

  return (
    <div
      className={`${styles.card} ${listView ? styles.cardList : ''}`}
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onKeyDown={e => e.key === 'Enter' && onClick(product)}
    >
      <div className={styles.imageWrap}>
        <img
          src={imgSrc(imgIndex)}
          alt={product.name}
          className={styles.image}
        />

        {/* Badges */}
        {isSoldOut
          ? <span className={`${styles.badge} ${styles.badgeSoldOut}`}>Sold Out</span>
          : product.onSale && <span className={`${styles.badge} ${styles.badgeSale}`}>Sale</span>
        }

        {/* Carousel arrows */}
        {uniqueImages.length > 1 && (
          <>
            <button
              className={`${styles.carouselBtn} ${styles.left}`}
              onClick={e => { e.stopPropagation(); setImgIndex(p => p === 0 ? uniqueImages.length - 1 : p - 1); }}
              aria-label="Previous image"
            >❮</button>
            <button
              className={`${styles.carouselBtn} ${styles.right}`}
              onClick={e => { e.stopPropagation(); setImgIndex(p => p === uniqueImages.length - 1 ? 0 : p + 1); }}
              aria-label="Next image"
            >❯</button>
          </>
        )}

        {/* Wishlist */}
        <button
          className={styles.wishlistBtn}
          onClick={e => e.stopPropagation()}
          aria-label="Add to wishlist"
        >♡</button>

        {/* Quick view */}
        <div className={styles.quickViewOverlay}>
          <button className={styles.quickViewBtn} aria-label="Quick view">Quick View</button>
        </div>
      </div>

      <div className={styles.info}>
        <h3>{product.name}</h3>
        <p className={styles.price}>
          ${product.price?.toFixed(2) || '0.00'}
        </p>

        {/* Color dots */}
        {colors.length > 0 && (
          <div className={styles.colorDots}>
            {colors.slice(0, 5).map(c => (
              <span
                key={c}
                className={styles.colorDot}
                style={{ background: getColorHex(c) }}
                title={c}
              />
            ))}
            {colors.length > 5 && (
              <span className={styles.moreColors}>+{colors.length - 5}</span>
            )}
          </div>
        )}

        <button
          className={styles.cardAddBtn}
          onClick={e => { e.stopPropagation(); onClick(product); }}
          aria-label={`Add ${product.name} to cart`}
        >
          {isSoldOut ? 'Sold Out' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

const SHOP_HERO_IMAGES = Array.from({ length: 13 }, (_, i) => `/images/shop${i + 1}.jpg`);

/* ============================================================
   ShopContent
   ============================================================ */
function ShopContent() {
  const [products,        setProducts]        = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [activeCategory,  setActiveCategory]  = useState(null);
  const [sortBy,          setSortBy]          = useState('default');
  const [listView,        setListView]        = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [email,           setEmail]           = useState('');
  const [subDone,         setSubDone]         = useState(false);
  const [openGroups,      setOpenGroups]      = useState({ categories: true });
  const [heroImgIndex,    setHeroImgIndex]    = useState(0);

  /* Modal state */
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize,    setSelectedSize]    = useState(null);
  const [selectedColor,   setSelectedColor]   = useState(null);
  const [imgIndex,        setImgIndex]        = useState(0);

  const { addToCart } = useCart();
  const searchParams  = useSearchParams();
  const searchQuery   = searchParams.get('q') || '';

  /* ── Load data ── */
  useEffect(() => {
    async function load() {
      try {
        const [prodData, catData] = await Promise.all([fetchProducts(), fetchCategories()]);
        setProducts(prodData);
        setCategories(catData);
        /* Pre-select category from ?q= param */
        if (searchQuery) {
          if (searchQuery.toLowerCase() === 'new-arrivals') {
            setActiveCategory('New Arrivals');
          } else {
            const match = catData.find(c => c.name.toLowerCase() === searchQuery.toLowerCase());
            if (match) setActiveCategory(match.name);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [searchQuery]);

  /* ── Hero Slideshow ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImgIndex(prev => (prev + 1) % SHOP_HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  /* ── Filter + Sort ── */
  let filtered = products;
  
  if (activeCategory === 'New Arrivals') {
    // Top 10 latest listings
    filtered = [...products].reverse().slice(0, 10);
  } else if (activeCategory) {
    filtered = products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
  }

  if (searchQuery && activeCategory !== 'New Arrivals') {
    if (searchQuery.toLowerCase() !== 'new-arrivals') {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc')  return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'name-asc')   return a.name.localeCompare(b.name);
    return 0;
  });

  /* ── Modal helpers ── */
  const variants    = selectedProduct?.variants || [];
  const allSizes    = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
  const allColors   = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
  const availForSize = selectedSize
    ? variants.filter(v => v.size === selectedSize && v.stockQuantity > 0).map(v => v.color)
    : [];
  const selectedVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);

  const modalImages = [];
  if (selectedProduct?.imageUrl)  modalImages.push(selectedProduct.imageUrl);
  if (selectedProduct?.imageUrls) modalImages.push(...selectedProduct.imageUrls);
  const uniqueModalImages = Array.from(new Set(modalImages));

  const openProduct = (product) => {
    setSelectedProduct(product);
    setSelectedSize(null);
    setSelectedColor(null);
    setImgIndex(0);
  };

  const handleAddToCart = () => {
    if (selectedProduct && selectedVariant) {
      addToCart(selectedProduct, selectedVariant, 1);
      setSelectedProduct(null);
    }
  };

  const toggleGroup = (key) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) return;
    setSubDone(true);
    setEmail('');
    setTimeout(() => setSubDone(false), 4000);
  };

  /* ── Inline promo every 8 cards ── */
  const buildGridItems = () => {
    const items = [];
    sorted.forEach((product, i) => {
      if (i > 0 && i % 8 === 0) {
        items.push({ type: 'promo', key: `promo-${i}` });
      }
      items.push({ type: 'product', product, key: `prod-${product.id}` });
    });
    return items;
  };
  const gridItems = buildGridItems();

  /* ── Active filter label ── */
  const activeCategoryObj = categories.find(c => c.name === activeCategory);

  return (
    <div className={styles.page}>
      <Nav />

      {/* ── HERO ── */}
      <section className={styles.shopHero} aria-label="Shop hero">
        {/* Full-bleed background slideshow */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {SHOP_HERO_IMAGES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Red Avo activewear ${index + 1}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: heroImgIndex === index ? 1 : 0,
                zIndex: heroImgIndex === index ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ))}
          <div className={styles.shopHeroBgOverlay} />
        </div>

        <div className={styles.shopHeroLeft}>
          {/* Breadcrumb */}
          <nav className={styles.shopHeroBreadcrumb} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span className={styles.shopHeroSep} aria-hidden="true">›</span>
            <span>{activeCategory || 'Shop'}</span>
          </nav>

          <span className={`section-label ${styles.shopHeroLabel}`}>Our Catalogue</span>
          <h1 className={styles.shopHeroTitle}>
            {activeCategory
              ? <>{activeCategory.split(' ')[0]}<br /><span className={styles.shopHeroTitleAccent}>{activeCategory.split(' ').slice(1).join(' ') || 'Collection'}</span></>
              : <>Shop The<br /><span className={styles.shopHeroTitleAccent}>Collection</span></>
            }
          </h1>
          <p className={styles.shopHeroSub}>
            Authentic activewear built for her motion. Every piece crafted to move as powerfully as you do.
          </p>
          <a href="#product-grid" className="btn-pill" id="hero-shop-btn">
            Shop Now
          </a>
        </div>
      </section>

      <main style={{ flex: 1 }}>
        {/* ── SIDEBAR + GRID LAYOUT ── */}
        <div className={styles.shopLayout}>

          {/* ── SIDEBAR ── */}
          <aside className={styles.sidebar} aria-label="Filter products">
            <p className={styles.sidebarTitle}>FILTERS</p>

            {/* Active chips */}
            {activeCategory && (
              <div className={styles.activeFilters}>
                <p className={styles.activeFiltersLabel}>Active Filters</p>
                <div className={styles.filterChips}>
                  <button className={styles.filterChip} onClick={() => setActiveCategory(null)}>
                    {activeCategory} ✕
                  </button>
                </div>
                <button className={styles.clearAll} onClick={() => setActiveCategory(null)}>
                  Clear all
                </button>
              </div>
            )}

            {/* Categories group */}
            <div className={styles.filterGroup}>
              <div
                className={styles.filterGroupHeader}
                onClick={() => toggleGroup('categories')}
                role="button"
                tabIndex={0}
                aria-expanded={openGroups.categories}
                onKeyDown={e => e.key === 'Enter' && toggleGroup('categories')}
              >
                <span className={styles.filterGroupLabel}>Categories</span>
                <span className={`${styles.filterGroupChevron} ${openGroups.categories ? styles.open : ''}`}>▼</span>
              </div>

              {openGroups.categories && (
                <div className={styles.filterCategoryBtns}>
                  <button
                    className={`${styles.filterCatBtn} ${!activeCategory ? styles.active : ''}`}
                    onClick={() => setActiveCategory(null)}
                    id="filter-all"
                  >
                    All Products
                    <span className={styles.filterCatCount}>{products.length}</span>
                  </button>
                  <button
                    className={`${styles.filterCatBtn} ${activeCategory === 'New Arrivals' ? styles.active : ''}`}
                    onClick={() => setActiveCategory('New Arrivals')}
                    id="filter-new-arrivals"
                  >
                    New Arrivals
                    <span className={styles.filterCatCount}>{Math.min(10, products.length)}</span>
                  </button>
                  {categories.map(cat => {
                    const count = products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length;
                    return (
                      <button
                        key={cat.id}
                        className={`${styles.filterCatBtn} ${activeCategory === cat.name ? styles.active : ''}`}
                        onClick={() => setActiveCategory(cat.name)}
                        id={`filter-${cat.id}`}
                      >
                        {cat.name}
                        <span className={styles.filterCatCount}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* ── CONTENT AREA ── */}
          <div className={styles.contentArea} id="product-grid">

            {/* ── TOOLBAR ── */}
            <div className={styles.toolbar} role="toolbar" aria-label="Product sorting and display options">
              <div className={styles.toolbarLeft}>
                <p className={styles.toolbarCount}>
                  Showing <strong>{sorted.length}</strong> {sorted.length === 1 ? 'product' : 'products'}
                  {activeCategory && <> in <strong>{activeCategory}</strong></>}
                </p>
              </div>
              <div className={styles.toolbarRight}>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  aria-label="Sort products"
                  id="shop-sort"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div className={styles.gridToggle} role="group" aria-label="View toggle">
                  <button
                    className={`${styles.gridToggleBtn} ${!listView ? styles.active : ''}`}
                    onClick={() => setListView(false)}
                    aria-label="Grid view"
                    id="view-grid"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="0" y="0" width="6" height="6" rx="1"/><rect x="10" y="0" width="6" height="6" rx="1"/>
                      <rect x="0" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/>
                    </svg>
                  </button>
                  <button
                    className={`${styles.gridToggleBtn} ${listView ? styles.active : ''}`}
                    onClick={() => setListView(true)}
                    aria-label="List view"
                    id="view-list"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="0" y="0" width="16" height="4" rx="1"/><rect x="0" y="6" width="16" height="4" rx="1"/>
                      <rect x="0" y="12" width="16" height="4" rx="1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── GRID ── */}
            {loading ? (
              <div className={styles.grid}>
                <p className={styles.loading}>Loading collection…</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className={styles.grid}>
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateTitle}>No Products Found</p>
                  <p className={styles.emptyStateSub}>Try adjusting your filters or search query.</p>
                  <button className="btn-pill" onClick={() => setActiveCategory(null)} id="clear-filters-btn">
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${styles.grid} ${listView ? styles.gridList : ''}`}>
                {gridItems.map(item =>
                  item.type === 'promo' ? (
                    <div key={item.key} className={styles.inlinePromo} aria-label="Promotional banner">
                      <div className={styles.inlinePromoBlob} aria-hidden="true" />
                      <div className={styles.inlinePromoText}>
                        <p className={styles.inlinePromoEyebrow}>Red Avo · Limited Drop</p>
                        <p className={styles.inlinePromoTitle}>New Season Arrivals</p>
                      </div>
                      <button className={styles.inlinePromoBtn} onClick={() => {
                        setActiveCategory('New Arrivals');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} id="promo-explore-btn">
                        Shop New Drops
                      </button>
                    </div>
                  ) : (
                    <ProductCard
                      key={item.key}
                      product={item.product}
                      onClick={openProduct}
                      listView={listView}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── NEWSLETTER ── */}
        <section className={styles.newsletter} aria-labelledby="newsletter-heading">
          <span className={`section-label ${styles.newsletterLabel}`}>Stay Connected</span>
          <h2 id="newsletter-heading" className={styles.newsletterTitle}>
            Join Our Community
          </h2>
          <p className={styles.newsletterSub}>
            Be the first to hear about new drops, exclusive offers, and behind-the-scenes stories.
          </p>
          <div className={styles.newsletterForm} role="form" aria-label="Email newsletter">
            <input
              className={styles.newsletterInput}
              type="email"
              placeholder={subDone ? "You're in! 🥑" : 'your@email.com'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              id="newsletter-email"
              aria-label="Email address"
            />
            <button
              className={styles.newsletterBtn}
              onClick={handleSubscribe}
              id="newsletter-submit"
              aria-label="Subscribe"
            >
              Subscribe
            </button>
          </div>
        </section>

        {/* ── FOOTER FEATURES ── */}
        <div className={styles.footerFeatures} aria-label="Shopping benefits">
          {FEATURES.map(f => (
            <div key={f.title} className={styles.footerFeature}>
              <div className={styles.footerFeatureIcon} aria-hidden="true">{f.icon}</div>
              <p className={styles.footerFeatureTitle}>{f.title}</p>
              <p className={styles.footerFeatureSub}>{f.sub}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── VARIANT MODAL ── */}
      {selectedProduct && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Product details for ${selectedProduct.name}`}
        >
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedProduct(null)}
              aria-label="Close"
            >✕</button>

            <div className={styles.modalLayout}>
              {/* Image */}
              <div className={styles.modalImage}>
                <div className={styles.carouselWrap}>
                  {uniqueModalImages.length > 1 && (
                    <button className={`${styles.carouselBtn} ${styles.left}`} onClick={() => setImgIndex(i => i === 0 ? uniqueModalImages.length - 1 : i - 1)}>❮</button>
                  )}
                  <img
                    src={uniqueModalImages.length > 0 ? `${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${uniqueModalImages[imgIndex]}` : 'https://placehold.co/400x500?text=No+Image'}
                    alt={selectedProduct.name}
                  />
                  {uniqueModalImages.length > 1 && (
                    <button className={`${styles.carouselBtn} ${styles.right}`} onClick={() => setImgIndex(i => i === uniqueModalImages.length - 1 ? 0 : i + 1)}>❯</button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className={styles.modalDetails}>
                <h2>{selectedProduct.name}</h2>
                <p className={styles.modalPrice}>${selectedProduct.price?.toFixed(2)}</p>
                {selectedProduct.description && (
                  <p className={styles.modalDesc}>{selectedProduct.description}</p>
                )}

                {variants.length > 0 ? (
                  <div className={styles.variants}>
                    {/* Size picker */}
                    {allSizes.length > 0 && (
                      <>
                        <h4>Select Size</h4>
                        <div className={styles.sizeGrid}>
                          {allSizes.map(size => {
                            const inStock = variants.some(v => v.size === size && v.stockQuantity > 0);
                            return (
                              <button
                                key={size}
                                className={`${styles.sizePill} ${selectedSize === size ? styles.selected : ''} ${!inStock ? styles.disabled : ''}`}
                                onClick={() => {
                                  if (!inStock) return;
                                  setSelectedSize(size);
                                  if (selectedColor && !variants.some(v => v.size === size && v.color === selectedColor && v.stockQuantity > 0)) {
                                    setSelectedColor(null);
                                  }
                                }}
                                aria-pressed={selectedSize === size}
                                aria-disabled={!inStock}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Color picker */}
                    {allColors.length > 0 && (
                      <>
                        <h4>Select Color {selectedSize ? '' : '(choose a size first)'}</h4>
                        <div className={styles.colorGrid}>
                          {allColors.map(color => {
                            const available = selectedSize
                              ? availForSize.includes(color)
                              : variants.some(v => v.color === color && v.stockQuantity > 0);
                            return (
                              <button
                                key={color}
                                title={color}
                                className={`${styles.colorCircle} ${selectedColor === color ? styles.selected : ''} ${!available ? styles.disabled : ''}`}
                                style={{ background: getColorHex(color) }}
                                onClick={() => {
                                  if (available) setSelectedColor(color);
                                }}
                                aria-label={color}
                                aria-pressed={selectedColor === color}
                                aria-disabled={!available}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}

                    {selectedVariant && (
                      <p style={{ marginBottom: 16, fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                        ✓ {selectedVariant.stockQuantity} in stock
                      </p>
                    )}
                  </div>
                ) : (
                  <p className={styles.noVariants}>No options available.</p>
                )}

                <button
                  className={styles.addToCartBtn}
                  disabled={!selectedVariant || selectedVariant.stockQuantity <= 0}
                  onClick={handleAddToCart}
                  id="modal-add-to-cart"
                >
                  {selectedVariant ? 'Add to Cart' : 'Select Size & Colour'}
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

/* ============================================================
   Page export (wrapped in Suspense for searchParams)
   ============================================================ */
export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.loading}>Loading…</div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
