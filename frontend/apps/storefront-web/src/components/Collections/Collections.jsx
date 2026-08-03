'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Link from 'next/link';
import styles from './Collections.module.css';

export default function Collections() {
  const sectionRef = useRef(null);
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/categories` : 'http://localhost:8080/api/categories'),
          fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/products` : 'http://localhost:8080/api/products')
        ]);
        const cats = await catsRes.json();
        const prods = await prodsRes.json();
        
        const validCats = cats.filter(c => c && c.name && c.name.trim() !== '');
        const counts = {};
        prods.forEach(p => {
          if (p.category) {
            const key = p.category.trim().toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
          }
        });
        
        const top = [...validCats].sort((a, b) => {
          const nameA = a.name.trim().toLowerCase();
          const nameB = b.name.trim().toLowerCase();
          
          const aStartsL = nameA.startsWith('l');
          const bStartsL = nameB.startsWith('l');
          
          if (aStartsL && !bStartsL) return -1;
          if (!aStartsL && bStartsL) return 1;

          const countA = counts[nameA] || 0;
          const countB = counts[nameB] || 0;
          return countB - countA;
        }).slice(0, 4);
        
        setTopCategories(top);
      } catch (err) {
        console.error('Failed to load collections', err);
      }
    }
    loadData();
  }, []);

  useGSAP(() => {
    if (topCategories.length === 0) return; // Wait until loaded

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
  }, { scope: sectionRef, dependencies: [topCategories] });

  return (
    <section id="collections" ref={sectionRef} className={styles.section} aria-labelledby="collections-heading">
      <div className={styles.container}>
        <span className={`${styles.label} collections-label`}>Shop by Category</span>
        <h2 id="collections-heading" className={`${styles.heading} collections-heading`}>
          THE SPRING COLLECTION
        </h2>

        <div className={`${styles.grid} coll-grid`}>
          {topCategories.map((cat) => (
            <article key={cat.id || cat.name} className={`${styles.card} coll-card`}>
              <div className={styles.cardImage}>
                <img 
                  src={cat.imageUrl || '/images/shop4.jpg'} 
                  alt={cat.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{cat.name}</h3>
                <Link href={`/shop?q=${encodeURIComponent(cat.name)}`} className={styles.exploreBtn} id={`explore-${cat.id || cat.name.replace(/\s+/g, '-')}`}>
                  EXPLORE
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
