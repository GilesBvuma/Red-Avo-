'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { fetchProducts, fetchCategories, fetchColors, API_URL } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import ShopByCategory from '@/components/ShopByCategory/ShopByCategory';
import styles from './shop.module.css';

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
   Color Resolver
   ============================================================ */
function resolveHex(name, colorMap) {
  if (!name || !colorMap) return '#9ca3af';
  const lowerName = name.toLowerCase().trim();
  
  const exactMatch = colorMap[name];
  if (exactMatch) return exactMatch;
  
  const dbMatch = Object.entries(colorMap).find(([k]) => k.toLowerCase() === lowerName);
  if (dbMatch) return dbMatch[1];
  
  return '#9ca3af';
}

/* ============================================================
   ProductCard
   ============================================================ */
function ProductCard({ product, onClick, listView, colorMap }) {
  const getColorHex = (name) => resolveHex(name, colorMap);
  const [imgIndex, setImgIndex] = useState(0);
  const [reviewSummary, setReviewSummary] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/products/${product.id}/reviews/summary`)
      .then(res => {
        if (!res.ok) throw new Error('Reviews not found');
        return res.json();
      })
      .then(data => setReviewSummary(data))
      .catch(() => setReviewSummary(null));
  }, [product.id]);

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
        <div className={styles.swipeCarousel}>
          {uniqueImages.length > 0 ? (
            uniqueImages.map((src, i) => (
              <img
                key={i}
                src={`${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${src}`}
                alt={`${product.name} - view ${i + 1}`}
                className={styles.image}
                loading="lazy"
              />
            ))
          ) : (
            <img src="https://placehold.co/400x500?text=No+Image" alt={product.name} className={styles.image} />
          )}
        </div>

        {/* Badges */}
        {isSoldOut
          ? <span className={`${styles.badge} ${styles.badgeSoldOut}`}>Sold Out</span>
          : product.onSale && <span className={`${styles.badge} ${styles.badgeSale}`}>Sale</span>
        }

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
        
        <div className={styles.priceRow}>
          <p className={styles.price}>
            ${product.price?.toFixed(2) || '0.00'}
          </p>
          {reviewSummary && reviewSummary.totalReviews > 0 && (
            <div className={styles.reviewSummary}>
              <span className={styles.star}>★</span>
              <span>{reviewSummary.averageRating}</span>
              <span className={styles.reviewCount}>({reviewSummary.totalReviews})</span>
            </div>
          )}
        </div>

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

const SHOP_HERO_IMAGES = ['/images/shop14.png', '/images/shop15.png', '/images/shop16.png'];

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
  const [openGroups,      setOpenGroups]      = useState({ categories: true, colors: true, sizes: true });
  const [heroImgIndex,    setHeroImgIndex]    = useState(0);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [activeColor,     setActiveColor]     = useState(null);
  const [activeSize,      setActiveSize]      = useState(null);
  // colorMap: name -> hexCode, built from /api/colors (public endpoint)
  const [colorMap,        setColorMap]        = useState({});

  const shopHeroRef = useRef(null);
  const titleWordsRef = useRef([]);

  /* ── Modal helpers removed ── */

  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams  = useSearchParams();
  const searchQuery   = searchParams.get('q') || '';

  /* ── Load data ── */
  useEffect(() => {
    async function load() {
      try {
        const [prodData, catData, colorData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchColors(),
        ]);
        setProducts(prodData);
        setCategories(catData);
        // Build name->hex lookup from DB colors
        const map = {};
        if (Array.isArray(colorData)) {
          colorData.forEach(c => { map[c.name] = c.hexCode; });
        }
        setColorMap(map);
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

  /* ── Hero Animation ── */
  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(
      '.shop-hero-breadcrumb',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo(
      titleWordsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    )
    .fromTo(
      '#hero-shop-btn',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    );
  }, { scope: shopHeroRef, dependencies: [activeCategory] });

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

  if (activeColor) {
    filtered = filtered.filter(p => {
      if (p.colors && p.colors.toLowerCase().includes(activeColor.toLowerCase())) return true;
      if (p.variants && p.variants.some(v => v.color && v.color.toLowerCase() === activeColor.toLowerCase())) return true;
      return false;
    });
  }

  if (activeSize) {
    filtered = filtered.filter(p => {
      if (p.sizes && p.sizes.toLowerCase().includes(activeSize.toLowerCase())) return true;
      if (p.variants && p.variants.some(v => v.size && v.size.toLowerCase() === activeSize.toLowerCase())) return true;
      return false;
    });
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc')  return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'name-asc')   return a.name.localeCompare(b.name);
    return 0;
  });

  /* ── Product helpers ── */

  const openProduct = (product) => {
    router.push(`/shop/${product.id}`);
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
      if (i === 4) {
        items.push({ type: 'promo', key: `promo-${i}` });
      }
      items.push({ type: 'product', product, key: `prod-${product.id}` });
    });
    return items;
  };
  const gridItems = buildGridItems();

  // Colors that actually appear on at least one product — sourced from DB hex map
  // All unique color names from products — no DB-match required so all product
  // colours appear even if the name differs slightly from the seeded palette.
  // getColorHex falls back to #9ca3af for unrecognised names.
  const allAvailableColors = Array.from(new Set(products.flatMap(p => {
    // Exclude Gift Card products since their colors are actually price denominations ($20, $50, etc)
    const isGiftCard = 
      (p.name && p.name.toLowerCase().includes('gift card')) || 
      (p.category && p.category.toLowerCase().includes('gift card'));
      
    if (isGiftCard) return [];

    let cs = [];
    if (p.colors) cs = cs.concat(p.colors.split(',').map(s => s.trim()));
    if (p.variants) cs = cs.concat(p.variants.map(v => v.color).filter(Boolean));
    return cs;
  }))).filter(Boolean).sort();

  // Helper: resolve hex from DB map, fall back to neutral grey
  const getColorHex = (name) => resolveHex(name, colorMap);

  // Whitelist of recognised size tokens — anything else (e.g. colour names that
  // leaked into a sizes field) is silently excluded.
  const KNOWN_SIZE_TOKENS = new Set([
    'XS','S','M','L','XL','XXL','2XL','3XL','4XL','XXXL',
    'ONE SIZE','ONESIZE','STANDARD','FREE SIZE','FREESIZE',
  ]);
  const allAvailableSizes = Array.from(new Set(products.flatMap(p => {
    let s = [];
    if (p.sizes) s = s.concat(p.sizes.split(',').map(str => str.trim()));
    if (p.variants) s = s.concat(p.variants.map(v => v.size).filter(Boolean));
    return s;
  }))).filter(s => s && KNOWN_SIZE_TOKENS.has(s.trim().toUpperCase())).sort();

  /* ── Active filter label & Title Words ── */
  const activeCategoryObj = categories.find(c => c.name === activeCategory);
  
  titleWordsRef.current = [];
  const getTitleWords = () => {
    if (activeCategory) {
      const parts = activeCategory.split(' ');
      const first = parts[0];
      const rest = parts.slice(1).join(' ') || 'Collection';
      return [
        { text: first, accent: false, br: true },
        ...rest.split(' ').map(w => ({ text: w, accent: true, br: false }))
      ];
    }
    return [
      { text: 'Shop', accent: false, br: false },
      { text: 'The', accent: false, br: true },
      { text: 'Collection', accent: true, br: false }
    ];
  };
  const titleWords = getTitleWords();

  return (
    <div className={styles.page}>
      <Nav />

      {/* ── HERO ── */}
      <section ref={shopHeroRef} className={styles.shopHero} aria-label="Shop hero">
        {/* Full-bleed background slideshow */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {SHOP_HERO_IMAGES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`RedAvo Activewear activewear ${index + 1}`}
              className={styles.shopHeroImage}
              style={{
                opacity: heroImgIndex === index ? 1 : 0,
                zIndex: heroImgIndex === index ? 1 : 0,
              }}
            />
          ))}
          <div className={styles.shopHeroBgOverlay} />
        </div>

        <div className={styles.shopHeroLeft}>
          {/* Breadcrumb */}
          <nav className={`shop-hero-breadcrumb ${styles.shopHeroBreadcrumb}`} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span className={styles.shopHeroSep} aria-hidden="true">›</span>
            <span>{activeCategory || 'Shop'}</span>
          </nav>

          
          <h1 className={styles.shopHeroTitle}>
            {titleWords.map((item, i) => (
              <React.Fragment key={i}>
                <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '4px', marginRight: item.br ? '0' : '0.2em' }}>
                  <span
                    className={item.accent ? styles.shopHeroTitleAccent : ''}
                    ref={(el) => {
                      if (el && !titleWordsRef.current.includes(el)) {
                        titleWordsRef.current.push(el);
                      }
                    }}
                    style={{ display: 'inline-block', willChange: 'transform, opacity' }}
                  >
                    {item.text}
                  </span>
                </span>
                {item.br && <br />}
              </React.Fragment>
            ))}
          </h1>
          <a href="#product-grid" className={styles.shopHeroCta} id="hero-shop-btn">
            Shop Now <span className={styles.ctaArrow}>&rarr;</span>
          </a>
        </div>
      </section>

      {/* ── SHOP BY CATEGORY ── */}
      <ShopByCategory categories={categories} products={products} />

      <main style={{ flex: 1 }}>
        {/* ── SIDEBAR + GRID LAYOUT ── */}
        <div className={styles.shopLayout}>

          {/* ── SIDEBAR ── */}
          <aside className={`${styles.sidebar} ${isMobileFilterOpen ? styles.sidebarOpen : ''}`} aria-label="Filter products">
            <div className={styles.sidebarHeader}>
              <p className={styles.sidebarTitle}>FILTERS</p>
              <button className={styles.closeSidebarBtn} onClick={() => setIsMobileFilterOpen(false)}>✕</button>
            </div>

            {/* Active chips */}
            {(activeCategory || activeColor || activeSize) && (
              <div className={styles.activeFilters}>
                <p className={styles.activeFiltersLabel}>Active Filters</p>
                <div className={styles.filterChips}>
                  {activeCategory && (
                    <button className={styles.filterChip} onClick={() => setActiveCategory(null)}>
                      {activeCategory} ✕
                    </button>
                  )}
                  {activeColor && (
                    <button className={styles.filterChip} onClick={() => setActiveColor(null)}>
                      {activeColor} ✕
                    </button>
                  )}
                  {activeSize && (
                    <button className={styles.filterChip} onClick={() => setActiveSize(null)}>
                      {activeSize} ✕
                    </button>
                  )}
                </div>
                <button className={styles.clearAll} onClick={() => {
                  setActiveCategory(null);
                  setActiveColor(null);
                  setActiveSize(null);
                }}>
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

            {/* Colors group */}
            {allAvailableColors.length > 0 && (
              <div className={styles.filterGroup}>
                <div
                  className={styles.filterGroupHeader}
                  onClick={() => toggleGroup('colors')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openGroups.colors}
                  onKeyDown={e => e.key === 'Enter' && toggleGroup('colors')}
                >
                  <span className={styles.filterGroupLabel}>Colors</span>
                  <span className={`${styles.filterGroupChevron} ${openGroups.colors ? styles.open : ''}`}>▼</span>
                </div>
                {openGroups.colors && (
                  <div className={styles.filterColorGrid}>
                    {allAvailableColors.map(color => (
                      <button
                        key={color}
                        className={`${styles.filterColorCircleBtn} ${activeColor === color ? styles.activeColorCircleBtn : ''}`}
                        onClick={() => setActiveColor(activeColor === color ? null : color)}
                        title={color}
                        aria-label={`Filter by ${color}`}
                        aria-pressed={activeColor === color}
                        style={{ background: getColorHex(color) }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sizes group */}
            {allAvailableSizes.length > 0 && (
              <div className={styles.filterGroup}>
                <div
                  className={styles.filterGroupHeader}
                  onClick={() => toggleGroup('sizes')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openGroups.sizes}
                  onKeyDown={e => e.key === 'Enter' && toggleGroup('sizes')}
                >
                  <span className={styles.filterGroupLabel}>Sizes</span>
                  <span className={`${styles.filterGroupChevron} ${openGroups.sizes ? styles.open : ''}`}>▼</span>
                </div>
                {openGroups.sizes && (
                  <div className={styles.filterSizeGrid}>
                    {allAvailableSizes.map(size => (
                      <button
                        key={size}
                        className={`${styles.filterSizeBtn} ${activeSize === size ? styles.active : ''}`}
                        onClick={() => setActiveSize(activeSize === size ? null : size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                <button
                  className={`${styles.gridToggleBtn} ${styles.mobileFilterBtn}`}
                  onClick={() => setIsMobileFilterOpen(true)}
                  aria-label="Filter & Sort"
                >
                  Filter
                </button>
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
                        <p className={styles.inlinePromoEyebrow}>RedAvo Activewear · Limited Drop</p>
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
                      colorMap={colorMap}
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
              placeholder={subDone ? "You're in!" : 'your@email.com'}
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
