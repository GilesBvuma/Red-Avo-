'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Placeholder from '@/components/Placeholder/Placeholder';
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
    // 3D image flies in
    .fromTo(
      imageRef.current,
      { opacity: 0, rotateY: -20, rotateX: 8, scale: 0.88 },
      { opacity: 1, rotateY: -8,  rotateX: 4, scale: 1, duration: 0.9, ease: 'power2.out' },
      0.2
    );

    // 3D image flattens on scroll
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start:   'top top',
      end:     'bottom top',
      scrub:   1,
      onUpdate: (self) => {
        const p = self.progress;
        if (imageRef.current) {
          gsap.set(imageRef.current, {
            rotateY: -8 + 8 * p,
            rotateX:  4 - 4 * p,
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

        <a id="hero-cta" href="#collections" className={styles.cta}>
          Shop the Collection
        </a>
      </div>

      {/* ── Right column — 3D image ── */}
      <div className={styles.right} aria-hidden="true">
        <div ref={imageRef} className={styles.imageWrap} style={{ perspective: '800px' }}>
          <Placeholder label="/images/hero-main.jpg" subtitle="Hero outfit flat-lay" />
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
