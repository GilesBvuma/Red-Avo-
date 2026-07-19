'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

const BANNERS = [
  {
    id: 'b1',
    num: '01',
    title: "Women's Collection",
    subtitle: 'Fearless. Feminine. Fierce.',
    desc: 'Crafted for the woman who refuses to slow down.',
    cta: 'Shop Women',
    href: '/shop?q=women',
    img: '/images/collection1.png',
  },
  {
    id: 'b2',
    num: '02',
    title: 'Sets & Matching',
    subtitle: 'Perfectly paired.',
    desc: 'Effortless put-together looks from studio to street.',
    cta: 'Shop Sets',
    href: '/shop?q=sets',
    img: '/images/collection2.png',
  },
  {
    id: 'b3',
    num: '03',
    title: 'Sports Bras',
    subtitle: 'Support meets style.',
    desc: 'High-performance support you\'ll actually want to wear.',
    cta: 'Shop Bras',
    href: '/shop?q=bra',
    img: '/images/collection3.png',
  },
  {
    id: 'b4',
    num: '04',
    title: 'Leggings',
    subtitle: 'Second-skin comfort.',
    desc: 'Buttery-soft, squat-proof, designed to flatter every curve.',
    cta: 'Shop Leggings',
    href: '/shop?q=leggings',
    img: '/images/collection4.png',
  },
  {
    id: 'b5',
    num: '05',
    title: 'New Arrivals',
    subtitle: 'Fresh off the rail.',
    desc: 'Be the first to wear what\'s new. Bold drops, built to last.',
    cta: 'See New Arrivals',
    href: '/shop?q=new-arrivals',
    img: '/images/collection5.png',
  },
];

export default function CollectionBanners() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    document.querySelectorAll('.banner-card').forEach((card) => {
      gsap.fromTo(
        card,
        { yPercent: 18, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%' },
        }
      );
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.bannersSection} aria-label="Featured collections">
      <div className={styles.bannersContainer}>
        <div className={styles.bannersHeader}>
          <span className="section-label">Featured Collections</span>
          <h2 className={styles.bannersTitle}>Shop By Category</h2>
        </div>

        <div className={styles.bannersStack}>
          {BANNERS.map((b, index) => {
            const isEven = index % 2 !== 0; // 0-based index means 1 is even numbered item
            return (
            <article
              key={b.id}
              className={`banner-card ${styles.bannerCard}`}
            >
              {/* Full-bleed image */}
              <div className={styles.bannerImgFill}>
                <Image
                  src={b.img}
                  alt={b.title}
                  fill
                  quality={100}
                  unoptimized={true}
                  priority={index < 2}
                  sizes="(max-width: 768px) 100vw, 100vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>

              {/* Text floated over the image */}
              <div className={`${styles.bannerText} ${isEven ? styles.bannerTextRight : ''}`}>
                <span className={styles.bannerNum}>{b.num}</span>
                <p className={styles.bannerSubtitle}>{b.subtitle}</p>
                <h3 className={styles.bannerTitle}>{b.title}</h3>
                <p className={styles.bannerDesc}>{b.desc}</p>
                <Link
                  href={b.href}
                  className={`btn-pill ${styles.bannerBtn}`}
                  id={`collection-${b.id}`}
                >
                  {b.cta}
                  <span className={styles.btnArrow} aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
