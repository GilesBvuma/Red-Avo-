'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { fetchProducts, fetchColors } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import styles from './NewArrivals.module.css';

export default function NewArrivals() {
  const sectionRef = useRef(null);
  const scrollRef = useRef(null);
  const router = useRouter();
  const [cartMsg, setCartMsg]   = useState({});
  const [products, setProducts] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [loading, setLoading]   = useState(true);
  const { toggleWishlist, isWishlisted } = useWishlist();

  // Helper to resolve hex code
  const resolveHex = (name, map) => {
    if (!name || !map) return '#9ca3af';
    const lowerName = name.toLowerCase().trim();
    if (map[name]) return map[name];
    const dbMatch = Object.entries(map).find(([k]) => k.toLowerCase() === lowerName);
    return dbMatch ? dbMatch[1] : '#9ca3af';
  };

  useEffect(() => {
    async function load() {
      try {
        const [prodData, colorData] = await Promise.all([
          fetchProducts(),
          fetchColors()
        ]);
        
        const map = {};
        if (Array.isArray(colorData)) {
          colorData.forEach(c => { map[c.name] = c.hexCode; });
        }
        setColorMap(map);

        // Filter for products that have images
        const withImages = prodData.filter(p => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0));
        // Take the latest 15 items added to the inventory
        const latest = [...withImages].reverse().slice(0, 15);

        const formatted = latest.map((p) => {
          const img = p.imageUrl || (p.imageUrls && p.imageUrls[0]) || '';
          const hoverImg = (p.imageUrls && p.imageUrls.length > 1) ? p.imageUrls[1] : img;
          
          let cs = [];
          if (p.colors) cs = cs.concat(p.colors.split(',').map(s => s.trim()));
          if (p.variants) cs = cs.concat(p.variants.map(v => v.color).filter(Boolean));
          const uniqueColors = Array.from(new Set(cs)).filter(Boolean).sort();

          // Use relative /uploads/ paths so Next.js rewrite handles the proxy.
          // This avoids remotePatterns issues with absolute localhost URLs.
          const toRelative = (u) => {
            if (!u) return null;
            if (u.startsWith('/uploads/')) return u;
            const idx = u.indexOf('/uploads/');
            return idx !== -1 ? u.slice(idx) : u;
          };
          const resolvedImg = toRelative(img) || 'https://placehold.co/400x500?text=No+Image';
          const resolvedHover = toRelative(hoverImg) || resolvedImg;

          return {
            id: p.id,
            name: p.name,
            // Display price (formatted)
            price: p.price || 0,
            displayPrice: `$${(p.price || 0).toFixed(2)}`,
            // Resolved image URLs for display
            image: resolvedImg,
            hoverImage: resolvedHover,
            // Raw fields kept so the wishlist page can re-resolve them
            imageUrl: resolvedImg,
            imageUrls: [resolvedImg, resolvedHover],
            colors: uniqueColors,
          };
        });
        setProducts(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = 0;
        }
      }
    }
    load();
  }, []);

  useGSAP(() => {
    if (loading) return;

    // Heading slides up
    gsap.fromTo(
      ['.new-arrivals-label', '.new-arrivals-heading', '.new-arrivals-link'],
      { yPercent: 40, opacity: 0 },
      {
        yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: '.new-arrivals-heading', start: 'top 85%' },
      }
    );

  }, { scope: sectionRef, dependencies: [loading, products] });

  const handleAddToCart = (id, btnId) => {
    setCartMsg((prev) => ({ ...prev, [id]: true }));
    // GSAP flash feedback
    gsap.fromTo(
      `#${btnId}`,
      { backgroundColor: '#5D8A3C' },
      { backgroundColor: '#8F0D13', duration: 1.2, ease: 'power2.inOut' }
    );
    setTimeout(() => setCartMsg((prev) => ({ ...prev, [id]: false })), 1600);
  };

  return (
    <section id="new-arrivals" ref={sectionRef} className={styles.section} aria-labelledby="new-arrivals-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={`${styles.label} new-arrivals-label`}>Latest Drops</span>
          <div className={styles.headingRow}>
            <h2 className={`${styles.heading} new-arrivals-heading`} id="new-arrivals-heading">
              NEW ARRIVALS
            </h2>
            <Link href="/shop?q=new-arrivals" className={`${styles.seeAll} new-arrivals-link`}>
              See All &rarr;
            </Link>
          </div>
        </div>

        {loading || products.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 6vw' }}>Loading new arrivals...</p>
        ) : (
          <div ref={scrollRef} className={`${styles.scrollGrid} new-arrivals-grid`}>
            {products.map((p) => {
              const btnId = `add-cart-new-${p.id}`;
              return (
                <article key={p.id} className={`${styles.card} new-arrivals-card`}>
                  <Link href={`/shop/${p.id}`} className={styles.cardLink}>
                    <div className={styles.cardImg}>
                      <Image 
                        src={p.image} 
                        alt={p.name} 
                        className={`${styles.productImg} ${styles.imgPrimary}`} 
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                      <Image 
                        src={p.hoverImage} 
                        alt={`${p.name} hover`} 
                        className={`${styles.productImg} ${styles.imgHover}`} 
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                      {/* Wishlist heart — top right */}
                      <button
                        className={`${styles.wishlistBtn} ${isWishlisted(p.id) ? styles.wishlistBtnActive : ''}`}
                        onClick={e => { e.preventDefault(); toggleWishlist(p.id, p); }}
                        aria-label={isWishlisted(p.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted(p.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      {/* Floating cart — bottom right */}
                      <button
                        id={btnId}
                        className={styles.floatingCartBtn}
                        onClick={e => { e.preventDefault(); router.push(`/shop/${p.id}`); }}
                        aria-label={`View ${p.name}`}
                      >
                        {cartMsg[p.id] ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </Link>
                  <div className={styles.cardBody}>
                    <h3 className={styles.productName}>{p.name}</h3>
                    <div className={styles.priceRow}>
                      <p className={styles.productPrice}>{p.displayPrice}</p>
                    </div>
                    
                    {p.colors && p.colors.length > 0 && (
                      <div className={styles.colorDots}>
                        {p.colors.slice(0, 5).map(c => (
                          <span
                            key={c}
                            className={styles.colorDot}
                            style={{ background: resolveHex(c, colorMap) }}
                            title={c}
                          />
                        ))}
                        {p.colors.length > 5 && (
                          <span className={styles.moreColors}>+{p.colors.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
