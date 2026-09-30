'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { fetchCollections } from '@/lib/api';
import styles from './CollectionsGrid.module.css';

export default function CollectionsGrid() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const gridRef = useRef(null);

  useEffect(() => {
    fetchCollections()
      .then(data => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  useGSAP(() => {
    if (!loading && collections.length > 0) {
      gsap.fromTo(
        '.collection-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out', delay: 0.15 }
      );
    }
  }, { scope: gridRef, dependencies: [loading, collections] });

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.skeletonGrid}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} className={styles.skeleton} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (collections.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.empty}>
            <p className={styles.emptyText}>Collections coming soon.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} ref={gridRef} aria-labelledby="collections-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Curated For You</span>
          <h2 id="collections-heading" className={styles.heading}>SHOP BY COLLECTION</h2>
        </div>
        <div className={styles.grid}>
          {collections.map((col, i) => {
            const imageUrl = col.coverImageUrl
              ? (col.coverImageUrl.startsWith('/uploads')
                  ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080'}${col.coverImageUrl}`
                  : col.coverImageUrl)
              : null;
            return (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className={`${styles.card} collection-card`}
                aria-label={`Shop ${col.name} collection`}
              >
                {/* Background image */}
                <div className={styles.cardImageWrap}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={col.name}
                      className={styles.cardImage}
                    />
                  ) : (
                    <div className={styles.cardImagePlaceholder}>
                      <span>🛍️</span>
                    </div>
                  )}
                  <div className={styles.overlay} />
                </div>

                {/* Content */}
                <div className={styles.cardContent}>
                  <span className={styles.productCount}>
                    {(col.products || []).length} piece{(col.products || []).length !== 1 ? 's' : ''}
                  </span>
                  <h3 className={styles.cardTitle}>{col.name}</h3>
                  {col.description && (
                    <p className={styles.cardDesc}>{col.description}</p>
                  )}
                  <span className={styles.cta}>
                    Explore Collection <span className={styles.ctaArrow}>→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
