'use client';

import React from 'react';
import Link from 'next/link';
import styles from './ShopByCategory.module.css';

// Fallback images in case category has no image URL
const FALLBACK_IMAGE = '/images/shop4.jpg';

export default function ShopByCategory({ categories, products = [] }) {
  // We remove duplicates or empty categories if any
  const validCategories = categories.filter(c => c && c.name && c.name.trim() !== '');

  // Calculate product counts per category
  const categoryCounts = {};
  products.forEach(p => {
    if (p.category) {
      const catKey = p.category.trim().toLowerCase();
      categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1;
    }
  });

  // Sort validCategories by count descending
  const sortedCategories = [...validCategories].sort((a, b) => {
    const countA = categoryCounts[a.name.trim().toLowerCase()] || 0;
    const countB = categoryCounts[b.name.trim().toLowerCase()] || 0;
    return countB - countA;
  });

  if (!sortedCategories || sortedCategories.length === 0) return null;

  return (
    <section className={styles.categorySection} aria-label="Shop by Category">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Shop by Category</h2>
        <div className={styles.carouselWrap}>
          <div className={styles.carousel}>
            {sortedCategories.map((cat) => {
              const nameTrimmed = cat.name.trim();
              const imgSrc = cat.imageUrl || FALLBACK_IMAGE;

              return (
                <Link 
                  key={cat.id || nameTrimmed} 
                  href={`/shop?q=${encodeURIComponent(nameTrimmed)}`}
                  className={styles.tile}
                  aria-label={`Shop ${nameTrimmed}`}
                >
                  {imgSrc ? (
                    <img 
                      src={imgSrc} 
                      alt={`Shop ${nameTrimmed}`} 
                      className={styles.image} 
                      loading="lazy" 
                    />
                  ) : (
                    <div className={styles.fallbackBg} />
                  )}
                  <div className={styles.overlay}>
                    <h3 className={styles.tileLabel}>{nameTrimmed}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
