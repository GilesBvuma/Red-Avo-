'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { CATEGORIES } from '@/constants/brand';
import Placeholder from '@/components/Placeholder/Placeholder';
import styles from './Collections.module.css';

export default function Collections() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Section heading fades up
    gsap.fromTo(
      ['.collections-label', '.collections-heading'],
      { yPercent: 60, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      }
    );

    // Cards stagger up one by one
    gsap.fromTo(
      '.coll-card',
      { yPercent: 80, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.coll-grid',
          start: 'top 85%',
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section id="collections" ref={sectionRef} className={styles.section} aria-labelledby="collections-heading">
      <div className={styles.container}>
        <span className={`${styles.label} collections-label`}>Shop by Category</span>
        <h2 id="collections-heading" className={`${styles.heading} collections-heading`}>
          SHOP THE COLLECTION
        </h2>

        <div className={`${styles.grid} coll-grid`}>
          {CATEGORIES.map((cat) => (
            <article key={cat.id} className={`${styles.card} coll-card`}>
              <div className={styles.cardImage}>
                <Placeholder label={cat.placeholder} subtitle={cat.subtitle} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{cat.label}</h3>
                <a href="#" className={styles.exploreBtn} id={`explore-${cat.id}`}>
                  EXPLORE
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
