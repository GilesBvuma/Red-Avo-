'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Placeholder from '@/components/Placeholder/Placeholder';
import Link from 'next/link';
import styles from './Hero.module.css';

const WORDS = ['WHERE', 'EVERY', 'MOVE', 'TELLS', 'A', 'STORY.'];

export default function Hero() {
  const sectionRef = useRef(null);
  const wordsRef   = useRef([]);
  const imageRef   = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    // Staggered word rise
    tl.fromTo(
      wordsRef.current,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity:  1,
        stagger:  0.1,
        duration: 0.65,
        ease:     'power3.out',
      }
    )
    // Subheading
    .fromTo('#hero-sub',   { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55 }, '-=0.3')
    // Description
    .fromTo('#hero-desc',  { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5  }, '-=0.3')
    // CTA
    .fromTo('#hero-cta',   { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5  }, '-=0.25')
    // Scroll indicator
    .fromTo('#hero-scroll', { opacity: 0 },               { opacity: 1, duration: 0.5  }, '-=0.1')
    // Background image fades in softly
    .fromTo(
      imageRef.current,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' },
      0
    );

    // Subtle parallax effect on scroll
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start:   'top top',
      end:     'bottom top',
      scrub:   1,
      onUpdate: (self) => {
        const p = self.progress;
        if (imageRef.current) {
          gsap.set(imageRef.current, {
            y: p * 50,
          });
        }
      },
    });

    // Bouncing scroll arrow
    gsap.to('#scroll-arrow', {
      y: 10,
      repeat: -1,
      yoyo: true,
      duration: 0.75,
      ease: 'sine.inOut',
    });

  }, { scope: sectionRef });

  return (
    <section id="hero" ref={sectionRef} className={styles.hero} aria-label="Hero">
      {/* Animated blob background */}
      <div className={styles.blob} aria-hidden="true" />

      {/* ── Left column ── */}
      <div className={styles.left}>
        <span className={styles.eyebrow}>New Collection · 2026</span>

        <h1 className={styles.heading} aria-label="Where every move tells a story.">
          {WORDS.map((word, i) => (
            <span key={word + i} className={styles.wordWrap}>
              <span
                className={styles.word}
                ref={(el) => (wordsRef.current[i] = el)}
              >
                {word}
              </span>
            </span>
          ))}
        </h1>

        <p id="hero-sub"  className={styles.subheading}>WHAT'S YOURS?</p>
        <p id="hero-desc" className={styles.desc}>
          Premium women's activewear. Built for her motion.
        </p>

        <Link id="hero-cta" href="/shop" className={styles.cta}>
          Shop the Collection
        </Link>
      </div>

      {/* ── Right column — 3D image ── */}
      <div className={styles.right} aria-hidden="true">
        <div ref={imageRef} className={styles.imageWrap} style={{ perspective: '800px' }}>
          <picture>
            <source media="(max-width: 900px)" srcSet="/images/Home-hero-mobile.jpeg" />
            <img src="/images/Home-hero.jpeg" alt="Red Avo Activewear" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </picture>
        </div>
      </div>

      {/* Scroll indicator */}
      <div id="hero-scroll" className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollLabel}>Scroll</span>
        <div id="scroll-arrow" className={styles.arrow} />
      </div>
    </section>
  );
}
