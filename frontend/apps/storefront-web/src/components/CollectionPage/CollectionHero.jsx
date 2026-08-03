'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

export default function CollectionHero() {
  const heroRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.hero-text-anim',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }
    )
    .fromTo('.hero-image-anim',
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1 }, '-=0.5'
    );
  }, { scope: heroRef });

  return (
    <section ref={heroRef} className={styles.fullHero} aria-label="Collections hero">
      {/* Desktop Image */}
      <Image
        src="/images/Collection-banner2.png"
        alt="RedAvo Activewear Collection"
        fill
        priority
        style={{ objectFit: 'cover' }}
        unoptimized={true}
        className={`hero-image-anim ${styles.desktopImage}`}
      />
      {/* Mobile Image */}
      <Image
        src="/images/Collection-banner2-mobile.png"
        alt="RedAvo Activewear Collection Mobile"
        fill
        priority
        style={{ objectFit: 'cover' }}
        unoptimized={true}
        className={`hero-image-anim ${styles.mobileImage}`}
      />
      <div className={styles.fullHeroOverlay} />
      <div className={styles.fullHeroContent}>
        <nav className={`hero-text-anim ${styles.breadcrumb}`} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
          <span>Collections</span>
        </nav>
        <h1 className={`${styles.heroHeading} hero-text-anim`}>
          CRAFTED FOR
          <span style={{ display: 'block' }}>ALL BODY TYPES</span>
        </h1>
        <p className={`${styles.heroBody} hero-text-anim`}>
          Performance-driven pieces.<br/>
          Designed for every body.
        </p>

        <Link href="/shop" className={`${styles.heroCta} hero-text-anim`} id="hero-shop-now">
          SHOP NOW <span className={styles.ctaArrow}>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
