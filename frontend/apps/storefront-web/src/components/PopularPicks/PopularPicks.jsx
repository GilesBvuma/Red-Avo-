'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { fetchProducts } from '@/lib/api';
import Placeholder from '@/components/Placeholder/Placeholder';
import styles from './PopularPicks.module.css';

export default function PopularPicks() {
  const sectionRef = useRef(null);
  const [cartMsg, setCartMsg]   = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const prodData = await fetchProducts();
        // Filter for products that have images
        const withImages = prodData.filter(p => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0));
        // Take the latest 10 items added to the inventory
        const latest = [...withImages].reverse().slice(0, 10);
        
        const formatted = latest.map((p, index) => {
          const img = p.imageUrl || (p.imageUrls && p.imageUrls[0]) || '';
          return {
            id: p.id,
            name: p.name,
            price: `$${(p.price || 0).toFixed(2)}`,
            placeholder: img ? `${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${img}` : 'https://placehold.co/400x500?text=No+Image',
            subtitle: p.category || '',
            featured: index === 1, // Make the middle one featured
          };
        });
        setProducts(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length);
    }, 4000); // 4 seconds
    return () => clearInterval(interval);
  }, [products.length]);

  useGSAP(() => {
    if (loading) return;

    // Heading slides up
    gsap.fromTo(
      '.popular-heading',
      { yPercent: 40, opacity: 0 },
      {
        yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.popular-heading', start: 'top 85%' },
      }
    );

    if (products.length > 0) {
      // Center card first, then side cards
      gsap.fromTo(
        '.product-center',
        { yPercent: 60, opacity: 0 },
        {
          yPercent: 0, opacity: 1, duration: 0.75, ease: 'power3.out',
          scrollTrigger: { trigger: '.popular-grid', start: 'top 80%' },
        }
      );
      gsap.fromTo(
        '.product-side',
        { yPercent: 80, opacity: 0 },
        {
          yPercent: 0, opacity: 1, stagger: 0.15, duration: 0.75, ease: 'power3.out',
          scrollTrigger: { trigger: '.popular-grid', start: 'top 80%' },
          delay: 0.15,
        }
      );
    }
  }, { scope: sectionRef, dependencies: [loading, products] });

  const handleAddToCart = (id, btnId) => {
    setCartMsg((prev) => ({ ...prev, [id]: true }));
    // GSAP flash feedback
    gsap.fromTo(
      `#${btnId}`,
      { backgroundColor: '#5D8A3C' },
      { backgroundColor: '#C0392B', duration: 1.2, ease: 'power2.inOut' }
    );
    setTimeout(() => setCartMsg((prev) => ({ ...prev, [id]: false })), 1600);
  };

  return (
    <section id="popular" ref={sectionRef} className={styles.section} aria-labelledby="popular-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={`${styles.heading} popular-heading`} id="popular-heading">
            THE FITS LOOK BOOK
          </h2>
        </div>

        {loading || products.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0' }}>Loading latest picks...</p>
        ) : (
          <div className={styles.carouselWindow}>
            <div 
              className={`${styles.track} popular-track`}
              style={{ '--activeIndex': activeIndex }}
            >
              {products.map((p, index) => {
                const isFeatured = index === activeIndex;
                const btnId = `add-cart-${p.id}`;
                return (
                  <div
                    key={p.id}
                    className={`${styles.cardWrap} ${isFeatured ? styles.centerWrap : ''}`}
                  >
                    <article className={styles.card}>
                      <div className={styles.cardImg}>
                        <Placeholder label={p.placeholder} subtitle={p.subtitle} />
                      </div>
                      <div className={styles.cardBody}>
                        <h3 className={styles.productName}>{p.name}</h3>
                        <p className={styles.productPrice}>{p.price}</p>
                        <button
                          id={btnId}
                          className={styles.cartBtn}
                          onClick={() => handleAddToCart(p.id, btnId)}
                        >
                          {cartMsg[p.id] ? '✓ ADDED' : 'ADD TO CART'}
                        </button>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
