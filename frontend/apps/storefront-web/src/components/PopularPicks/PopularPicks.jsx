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
        // Take the last 3 items added to the inventory
        const latest = [...prodData].reverse().slice(0, 3);
        
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

  useGSAP(() => {
    if (loading) return;

    // Ribbon slides in from left
    gsap.fromTo(
      '.popular-ribbon',
      { xPercent: -30, opacity: 0 },
      {
        xPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.popular-ribbon', start: 'top 85%' },
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
          <div className={`${styles.ribbon} popular-ribbon`} id="popular-heading" role="heading" aria-level={2}>
            POPULAR PICKS
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0' }}>Loading latest picks...</p>
        ) : (
          <div className={`${styles.grid} popular-grid`}>
            {products.map((p) => {
              const isFeatured = p.featured;
              const btnId = `add-cart-${p.id}`;
              return (
                <article
                  key={p.id}
                  className={`${styles.card} ${isFeatured ? `${styles.center} product-center` : `${styles.side} product-side`}`}
                >
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
