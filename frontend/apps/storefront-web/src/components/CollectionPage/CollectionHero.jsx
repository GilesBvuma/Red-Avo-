'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

const HERO_IMAGES = Array.from({ length: 13 }, (_, i) => `/images/shop${i + 1}.jpg`);

export default function CollectionHero() {
  const heroRef = useRef(null);
  const [heroImgIndex, setHeroImgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
    )
    .fromTo('.hero-img-wrap',
      { xPercent: 8, opacity: 0, scale: 0.96 },
      { xPercent: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' }, '-=0.8'
    )
    .fromTo('.hero-blob',
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.3, ease: 'power2.out' }, '-=1.2'
    );

    // Subtle float on blob
    gsap.to('.hero-blob', {
      y: -18,
      yoyo: true,
      repeat: -1,
      duration: 1.5,
      ease: 'sine.inOut',
    });

    // Parallax on scroll
    gsap.to('.hero-img-wrap', {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  }, { scope: heroRef });

  return (
    <section ref={heroRef} className={styles.hero} aria-label="Collections hero">
      {/* Hero Background Images */}
      <div className={styles.heroBg} aria-hidden="true">
        <Image
          src="/images/Collections-banner.png"
          alt="Red Avo Collections Desktop Background"
          fill
          priority
          unoptimized={true}
          className={styles.desktopImg}
          style={{ objectFit: 'cover' }}
        />
        <Image
          src="/images/Collections-banner-mobile.png"
          alt="Red Avo Collections Mobile Background"
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
        <p className={`hero-body ${styles.heroBody}`}>
          From sunrise runs to evening lounging — Red Avo has a look for every mood,
          every body, and every moment. Discover pieces built to move with you.
        </p>
        <Link href="/shop" className={`btn-pill hero-cta ${styles.heroCta}`} id="hero-shop-now">
          Shop Now
        </Link>

        {/* Decorative hearts */}
        <div className={styles.heroDecorations} aria-hidden="true">
          <span className={styles.heartLg}>♥</span>
          <span className={styles.heartSm}>♥</span>
          <span className={styles.heartTiny}>♥</span>
        </div>
      </div>

      {/* Right column */}
      <div className={styles.heroRight}>
        {/* Blob background */}
        <div className={`hero-blob ${styles.blob}`} aria-hidden="true" />

        {/* Image Slideshow */}
        <div className={`hero-img-wrap ${styles.heroImgWrap}`}>
          {HERO_IMAGES.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Red Avo Collections — ${index + 1}`}
              fill
              unoptimized={true}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{
                objectFit: 'cover',
                opacity: heroImgIndex === index ? 1 : 0,
                zIndex: heroImgIndex === index ? 1 : 0,
                transition: 'opacity 1s ease-in-out'
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
