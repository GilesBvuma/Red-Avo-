'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { PRODUCTS } from '@/constants/brand';
import Placeholder from '@/components/Placeholder/Placeholder';
import styles from './PopularPicks.module.css';

export default function PopularPicks() {
  const sectionRef = useRef(null);
  const [cartMsg, setCartMsg]   = useState({});

  useGSAP(() => {
    // Ribbon slides in from left
    gsap.fromTo(
      '.popular-ribbon',
      { xPercent: -30, opacity: 0 },
      {
        xPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.popular-ribbon', start: 'top 85%' },
      }
    );

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
  }, { scope: sectionRef });

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

        <div className={`${styles.grid} popular-grid`}>
          {PRODUCTS.map((p) => {
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
      </div>
    </section>
  );
}
