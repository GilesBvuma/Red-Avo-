'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

export default function CollectionBanner2() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.banner2-anim',
      { y: 30, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={`${styles.banner} ${styles.bannerReverse}`} aria-label="Sets & Matching">
      <div className={styles.bannerContent}>
        <p className={`${styles.bannerSubtitle} banner2-anim`}>PERFECTLY PAIRED.</p>
        <h2 className={`${styles.bannerTitle} banner2-anim`}>SETS &<br/>MATCHING</h2>
        <p className={`${styles.heroBody} banner2-anim`} style={{ marginBottom: '32px' }}>
          Effortless put-together looks.<br/>
          From studio to street.
        </p>
        <Link href="/shop?q=sets" className={`btn-pill banner2-anim`} style={{ background: 'var(--collection-burgundy)' }}>
          EXPLORE SETS &rarr;
        </Link>
      </div>
      <div className={styles.bannerImage}>
        <Image
          src="/images/collection2.png"
          alt="Sets and Matching"
          fill
          style={{ objectFit: 'cover' }}
          unoptimized={true}
        />
      </div>
    </section>
  );
}
