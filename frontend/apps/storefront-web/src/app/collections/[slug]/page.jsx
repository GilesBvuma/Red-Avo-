// This file is auto-generated to mirror the shop page functionality
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import { fetchCollectionBySlug, fetchColors } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';

import cardStyles from '@/components/NewArrivals/NewArrivals.module.css';
import shopStyles from '@/app/shop/shop.module.css';
import styles from './collection-slug.module.css';

const SORT_OPTIONS = [
  { value: 'default',   label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc',  label: 'Name A→Z' },
];

function resolveHex(name, colorMap) {
  if (!name || !colorMap) return '#9ca3af';
  const lowerName = name.toLowerCase().trim();
  
  const exactMatch = colorMap[name];
  if (exactMatch) return exactMatch;
  
  const dbMatch = Object.entries(colorMap).find(([k]) => k.toLowerCase() === lowerName);
  if (dbMatch) return dbMatch[1];
  
  return '#9ca3af';
}



function ProductCard({ product, onClick, listView, colorMap }) {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const router = useRouter();

  const img = product.imageUrl || (product.imageUrls && product.imageUrls[0]) || '';
  const hoverImg = (product.imageUrls && product.imageUrls.length > 1) ? product.imageUrls[1] : img;

  let cs = [];
  if (product.colors && typeof product.colors === 'string') {
    cs = cs.concat(product.colors.split(',').map(s => s.trim()));
  } else if (Array.isArray(product.colors)) {
    cs = cs.concat(product.colors);
  }
  if (product.variants) cs = cs.concat(product.variants.map(v => v.color).filter(Boolean));
  const uniqueColors = Array.from(new Set(cs)).filter(Boolean).sort();

  // Build image URLs - use relative /uploads path to hit Next.js rewrites
  const toRelative = (url) => {
    if (!url) return null;
    if (url.startsWith('/uploads/')) return url;
    const idx = url.indexOf('/uploads/');
    if (idx !== -1) return url.slice(idx);
    return url;
  };

  const resolvedImg   = toRelative(img)   || 'https://placehold.co/400x500?text=No+Image';
  const resolvedHover = toRelative(hoverImg) || resolvedImg;

  const isSoldOut = product.stockQuantity <= 0;
  const displayPrice = '$' + (product.price || 0).toFixed(2);

  return (
    <article className={`${cardStyles.card} ${listView ? shopStyles.cardList : ''}`}>
      <Link href={`/shop/${product.id}`} className={cardStyles.cardLink}>
        <div className={cardStyles.cardImg}>
          <Image
            src={resolvedImg}
            alt={product.name}
            className={`${cardStyles.productImg} ${cardStyles.imgPrimary}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
          <Image
            src={resolvedHover}
            alt={`${product.name} hover`}
            className={`${cardStyles.productImg} ${cardStyles.imgHover}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
          {/* Badges */}
          {isSoldOut
            ? <span className={`${shopStyles.badge} ${shopStyles.badgeSoldOut}`}>Sold Out</span>
            : product.onSale && <span className={`${shopStyles.badge} ${shopStyles.badgeSale}`}>Sale</span>
          }
          {/* Wishlist heart - same as home page */}
          <button
            className={`${cardStyles.wishlistBtn} ${isWishlisted(product.id) ? cardStyles.wishlistBtnActive : ''}`}
            onClick={e => { e.preventDefault(); toggleWishlist(product.id, product); }}
            aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          {/* Floating cart icon - navigates to product */}
          <button
            className={cardStyles.floatingCartBtn}
            onClick={e => { e.preventDefault(); router.push(`/shop/${product.id}`); }}
            aria-label={`View ${product.name}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </button>
        </div>
      </Link>
      <div className={cardStyles.cardBody}>
        <h3 className={cardStyles.productName}>{product.name}</h3>
        <div className={cardStyles.priceRow}>
          <p className={cardStyles.productPrice}>{displayPrice}</p>
        </div>
        {uniqueColors.length > 0 && (
          <div className={cardStyles.colorDots}>
            {uniqueColors.slice(0, 5).map(c => (
              <span
                key={c}
                className={cardStyles.colorDot}
                style={{ background: resolveHex(c, colorMap) }}
                title={c}
              />
            ))}
            {uniqueColors.length > 5 && (
              <span className={cardStyles.moreColors}>+{uniqueColors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}



const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
  return url;
}

export default function CollectionSlugPage() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [colorMap, setColorMap]     = useState({});

  // Layout states from Shop page
  const [activeColor, setActiveColor] = useState(null);
  const [activeSize, setActiveSize] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [listView, setListView] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ colors: true, sizes: true });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      fetchCollectionBySlug(slug),
      fetchColors()
    ]).then(([collData, cData]) => {
      setCollection(collData);
      const map = {};
      if (Array.isArray(cData)) cData.forEach(c => map[c.name] = c.hexCode);
      setColorMap(map);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleGroup = (grp) => {
    setOpenGroups(prev => ({ ...prev, [grp]: !prev[grp] }));
  };

  if (loading) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#9ca3af' }}>Loading collection…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !collection) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a2b4a' }}>Collection not found</p>
          <Link href="/collections" style={{ color: '#8F0D13', textDecoration: 'underline', fontWeight: 600 }}>← Back to Collections</Link>
        </main>
        <Footer />
      </>
    );
  }

  const heroUrl = resolveImageUrl(collection.heroImageUrl);
  const rawProducts = collection.products || [];

  // Gather unique available colors & sizes within this collection
  const allAvailableColors = Array.from(new Set(rawProducts.flatMap(p => {
    let cs = [];
    if (p.colors) cs = cs.concat(p.colors.split(',').map(s => s.trim()));
    if (p.variants) cs = cs.concat(p.variants.map(v => v.color).filter(Boolean));
    return cs;
  }))).filter(Boolean).sort();

  const getColorHex = (name) => resolveHex(name, colorMap);

  const KNOWN_SIZE_TOKENS = new Set([
    'XS','S','M','L','XL','XXL','2XL','3XL','4XL','XXXL',
    'ONE SIZE','ONESIZE','STANDARD','FREE SIZE','FREESIZE',
  ]);
  const allAvailableSizes = Array.from(new Set(rawProducts.flatMap(p => {
    let s = [];
    if (p.sizes) s = s.concat(p.sizes.split(',').map(str => str.trim()));
    if (p.variants) s = s.concat(p.variants.map(v => v.size).filter(Boolean));
    return s;
  }))).filter(s => s && KNOWN_SIZE_TOKENS.has(s.trim().toUpperCase())).sort();

  // Filter products
  let filtered = rawProducts.filter(p => {
    if (activeColor) {
      let pColors = [];
      if (p.colors) pColors = pColors.concat(p.colors.split(',').map(s => s.trim().toLowerCase()));
      if (p.variants) pColors = pColors.concat(p.variants.map(v => v.color?.toLowerCase()).filter(Boolean));
      if (!pColors.includes(activeColor.toLowerCase())) return false;
    }
    if (activeSize) {
      let pSizes = [];
      if (p.sizes) pSizes = pSizes.concat(p.sizes.split(',').map(s => s.trim().toUpperCase()));
      if (p.variants) pSizes = pSizes.concat(p.variants.map(v => v.size?.toUpperCase()).filter(Boolean));
      if (!pSizes.includes(activeSize.toUpperCase())) return false;
    }
    return true;
  });

  // Sort products
  filtered.sort((a, b) => {
    const pA = a.salePrice || a.price || 0;
    const pB = b.salePrice || b.price || 0;
    if (sortBy === 'price-asc') return pA - pB;
    if (sortBy === 'price-desc') return pB - pA;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return 0; // default order
  });

  return (
    <>
      <Nav />
      <main className={styles.page}>
        {/* ── HERO ── */}
        <section className={styles.hero} aria-label={`${collection.name} hero`}>
          {heroUrl ? (
            <img src={heroUrl} alt={collection.name} className={styles.heroImage} />
          ) : (
            <div className={styles.heroFallback} />
          )}
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true"> / </span>
              <Link href="/collections">Collections</Link>
              <span aria-hidden="true"> / </span>
              <span>{collection.name}</span>
            </nav>
            <h1 className={styles.heroTitle}>{collection.name}</h1>
            {collection.description && (
              <p className={styles.heroDesc} dangerouslySetInnerHTML={{ __html: collection.description }}></p>
            )}
            <span className={styles.heroBadge}>{rawProducts.length} piece{rawProducts.length !== 1 ? 's' : ''}</span>
          </div>
        </section>

        {/* ── SHOP LAYOUT ── */}
        <div className={shopStyles.shopLayout} style={{ paddingTop: '24px' }}>
          
          {/* -- SIDEBAR -- */}
          <aside className={`${shopStyles.sidebar} ${isMobileFilterOpen ? shopStyles.sidebarOpen : ''}`} aria-label="Filter products">
            <div className={shopStyles.sidebarHeader}>
              <p className={shopStyles.sidebarTitle}>FILTERS</p>
              <button className={shopStyles.closeSidebarBtn} onClick={() => setIsMobileFilterOpen(false)}>✕</button>
            </div>

            {/* Active chips */}
            {(activeColor || activeSize) && (
              <div className={shopStyles.activeFilters}>
                <p className={shopStyles.activeFiltersLabel}>Active Filters</p>
                <div className={shopStyles.filterChips}>
                  {activeColor && (
                    <button className={shopStyles.filterChip} onClick={() => setActiveColor(null)}>
                      {activeColor} ✕
                    </button>
                  )}
                  {activeSize && (
                    <button className={shopStyles.filterChip} onClick={() => setActiveSize(null)}>
                      {activeSize} ✕
                    </button>
                  )}
                </div>
                <button className={shopStyles.clearAll} onClick={() => {
                  setActiveColor(null);
                  setActiveSize(null);
                }}>
                  Clear all
                </button>
              </div>
            )}

            {/* Colors group */}
            {allAvailableColors.length > 0 && (
              <div className={shopStyles.filterGroup}>
                <div
                  className={shopStyles.filterGroupHeader}
                  onClick={() => toggleGroup('colors')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openGroups.colors}
                  onKeyDown={e => e.key === 'Enter' && toggleGroup('colors')}
                >
                  <span className={shopStyles.filterGroupLabel}>Color</span>
                  <span className={`${shopStyles.filterGroupChevron} ${openGroups.colors ? shopStyles.open : ''}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
                </div>

                {openGroups.colors && (
                  <div className={shopStyles.filterColorGrid}>
                    {allAvailableColors.map(color => {
                      const isActive = activeColor === color;
                      return (
                        <button
                          key={color}
                          className={`${shopStyles.filterColorCircleBtn} ${isActive ? shopStyles.activeColorCircleBtn : ''}`}
                          onClick={() => setActiveColor(isActive ? null : color)}
                          title={color}
                          aria-pressed={isActive}
                          aria-label={`Filter by ${color}`}
                          style={{ background: getColorHex(color) }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sizes group */}
            {allAvailableSizes.length > 0 && (
              <div className={shopStyles.filterGroup}>
                <div
                  className={shopStyles.filterGroupHeader}
                  onClick={() => toggleGroup('sizes')}
                  role="button"
                  tabIndex={0}
                  aria-expanded={openGroups.sizes}
                  onKeyDown={e => e.key === 'Enter' && toggleGroup('sizes')}
                >
                  <span className={shopStyles.filterGroupLabel}>Size</span>
                  <span className={`${shopStyles.filterGroupChevron} ${openGroups.sizes ? shopStyles.open : ''}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
                </div>

                {openGroups.sizes && (
                  <div className={shopStyles.filterSizesGrid}>
                    {allAvailableSizes.map(size => {
                      const isActive = activeSize === size;
                      return (
                        <button
                          key={size}
                          className={`${shopStyles.filterSizeBtn} ${isActive ? shopStyles.active : ''}`}
                          onClick={() => setActiveSize(isActive ? null : size)}
                          aria-pressed={isActive}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* -- MAIN CONTENT -- */}
          <div className={shopStyles.contentArea}>
            <div className={shopStyles.toolbar}>
              {/* Mobile Filter Toggle */}
              <button
                className={`${shopStyles.gridToggleBtn} ${shopStyles.mobileFilterBtn}`}
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                Filter
              </button>

              <div className={shopStyles.toolbarRight}>
                {/* Product Count */}
                <span className={shopStyles.toolbarCount}>
                  {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
                </span>

                {/* Sort Dropdown */}
                <div className={shopStyles.sortWrapper}>
                  <select
                    className={shopStyles.sortSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort products"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <svg className={shopStyles.sortIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                {/* Grid/List Toggle */}
                <div className={shopStyles.gridToggle}>
                  <button
                    className={`${shopStyles.gridToggleBtn} ${!listView ? shopStyles.active : ''}`}
                    onClick={() => setListView(false)}
                    aria-label="Grid view"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </button>
                  <button
                    className={`${shopStyles.gridToggleBtn} ${listView ? shopStyles.active : ''}`}
                    onClick={() => setListView(true)}
                    aria-label="List view"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="4"/><rect x="3" y="10" width="18" height="4"/><rect x="3" y="16" width="18" height="4"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Count */}
            <p className={shopStyles.toolbarCount}>
              {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
            </p>

            {/* -- PRODUCT GRID -- */}
            {filtered.length === 0 ? (
              <div className={shopStyles.noProducts}>
                <div className={shopStyles.noProductsIcon}>👀</div>
                <p>No products match your selected filters.</p>
                <button
                  className={"btn-pill"}
                  onClick={() => { setActiveColor(null); setActiveSize(null); }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`${shopStyles.grid} ${listView ? shopStyles.gridList : ''}`}>
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    listView={listView}
                    colorMap={colorMap}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
