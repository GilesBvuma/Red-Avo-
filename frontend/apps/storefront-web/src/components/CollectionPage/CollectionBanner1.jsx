'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

export default function CollectionBanner1() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.banner1-anim',
      { y: 30, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.fullWidthBanner} aria-label="Women's Collection">
      <Image
        src="/images/Collection-banner3.png"
        alt="Women's Collection"
        fill
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        unoptimized={true}
      />
      {/* Subtle text shadow overlay for legibility without a solid box */}
      <div className={styles.fullWidthBannerOverlay} />
      <div className={styles.fullWidthBannerContent}>
        <p className={`${styles.bannerSubtitle} banner1-anim`} style={{ color: 'var(--collection-white)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>FEARLESS. FEMININE. FIERCE.</p>
        <h2 className={`${styles.bannerTitle} banner1-anim`} style={{ color: 'var(--collection-white)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>WOMEN'S<br/>COLLECTION</h2>
        <p className={`${styles.heroBody} banner1-anim`} style={{ marginBottom: '32px', color: 'var(--collection-white)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          Designed for strength.<br/>
          Made to inspire.
        </p>
        <Link href="/shop?q=women" className={`btn-pill banner1-anim`} style={{ background: 'var(--collection-white)', color: 'var(--collection-black)' }}>
          EXPLORE WOMEN'S &rarr;
        </Link>
      </div>
    </section>
  );
}
