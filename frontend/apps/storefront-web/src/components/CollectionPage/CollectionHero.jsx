'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

export default function CollectionHero() {
  const heroRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.hero-label',
      { yPercent: 40, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7 }
    )
    .fromTo('.hero-heading',
      { yPercent: 30, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9 }, '-=0.4'
    )
    .fromTo('.hero-body',
      { yPercent: 20, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7 }, '-=0.5'
    )
    .fromTo('.hero-cta',
      { yPercent: 20, opacity: 0, scale: 0.94 },
      { yPercent: 0, opacity: 1, scale: 1, duration: 0.6 }, '-=0.4'
    );
  }, { scope: heroRef });

  return (
    <section ref={heroRef} className={styles.hero} aria-label="Collections hero">
      {/* Hero Background Images */}
      <div className={styles.heroBg} aria-hidden="true">
        <Image
          src="/images/Collections-banner.png"
          alt="RedAvo Activewear Collections Desktop Background"
          fill
          priority
          unoptimized={true}
          className={styles.desktopImg}
          style={{ objectFit: 'cover' }}
        />
        <Image
          src="/images/Collections-banner-mobile.png"
          alt="RedAvo Activewear Collections Mobile Background"
          fill
          priority
          unoptimized={true}
          className={styles.mobileImg}
          style={{ objectFit: 'cover' }}
        />
        {/* Overlay removed */}
      </div>

      {/* Left column */}
      <div className={styles.heroLeft}>
        <span className={`section-label hero-label ${styles.heroLabel}`}>
          Explore Our Collections
        </span>
        <h1 className={`hero-heading ${styles.heroHeading}`}>
          Collections<br />
          <em className={styles.heroHeadingItalic}>Designed</em><br />
          For Every Move
        </h1>

        <Link href="/shop" className={`hero-cta ${styles.heroCta}`} id="hero-shop-now">
          Shop Now <span className={styles.ctaArrow}>&rarr;</span>
        </Link>

        {/* Decorative hearts */}
        <div className={styles.heroDecorations} aria-hidden="true">
          <span className={styles.heartLg}>♥</span>
          <span className={styles.heartSm}>♥</span>
          <span className={styles.heartTiny}>♥</span>
        </div>
      </div>

    </section>
  );
}
