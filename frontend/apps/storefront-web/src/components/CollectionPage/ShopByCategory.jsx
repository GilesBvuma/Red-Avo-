'use client';

import { useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

const CATEGORIES = [
  { id: 'cat1', eyebrow: 'Fresh off the rail.', title: 'New Arrivals', desc: 'Be the first to wear what\'s new. Bold drops, built to last.', img: '/images/collection5.png', href: '/shop?q=new-arrivals' },
  { id: 'cat2', eyebrow: 'Second-skin comfort.', title: 'Leggings', desc: 'Buttery-soft, squat-proof, designed to flatter every curve.', img: '/images/collection4.png', href: '/shop?q=leggings' },
  { id: 'cat3', eyebrow: 'Support meets style.', title: 'Sports Bras', desc: 'High-performance support you\'ll actually want to wear.', img: '/images/collection1.png', href: '/shop?q=bra' },
  { id: 'cat4', eyebrow: 'Perfectly paired.', title: 'Tracksuits', desc: 'Effortless put-together looks from studio to street.', img: '/images/collection2.png', href: '/shop?q=tracksuit' }
];

export default function ShopByCategory() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.category-card-anim',
      { y: 40, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' }
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.shopByCategory} aria-label="Shop By Category">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>Featured Collections</span>
        <h2 className={styles.sectionTitle}>SHOP BY<br/>CATEGORY</h2>
      </div>

      <div className={styles.embla}>
        <div className={styles.embla__container}>
          {CATEGORIES.map((cat) => (
            <div className={styles.embla__slide} key={cat.id}>
              <div className={`${styles.categoryCard} category-card-anim`}>
                <div className={styles.categoryImage}>
                  <Image src={cat.img} alt={cat.title} fill style={{ objectFit: 'cover' }} unoptimized={true} draggable={false} />
                </div>
                <div className={styles.categoryContent}>
                  <p className={styles.eyebrow}>{cat.eyebrow}</p>
                  <h3 className={styles.headline}>{cat.title}</h3>
                  <p className={styles.subtext}>{cat.desc}</p>
                  <div>
                    <Link href={cat.href} className={styles.ctaButton}>
                      SEE {cat.title}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
