'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Placeholder from '@/components/Placeholder/Placeholder';
import Link from 'next/link';
import styles from './Hero.module.css';

const WORDS = ['Own', 'your', 'story.', 'Move', 'with', 'confidence'];

export default function Hero() {
  const sectionRef = useRef(null);
  const wordsRef   = useRef([]);
  const imageRef   = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    // Background image fades in softly
    tl.fromTo(
      imageRef.current,
      { opacity: 0, scale: 1.06 },
      { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out' },
      0
    )
    // Collection badge
    .fromTo('#hero-badge', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=1.1')
    // Heading (staggered words with fade up)
    .fromTo(
      wordsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out' },
      '-=0.7'
    )
    // CTA
    .fromTo('#hero-cta', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.5');

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

  }, { scope: sectionRef });

  return (
    <section id="hero" ref={sectionRef} className={styles.hero} aria-label="Hero">
      {/* Animated blob background */}
      <div className={styles.blob} aria-hidden="true" />

      {/* Soft light bloom behind text */}
      <div className={styles.lightBloom} aria-hidden="true" />

      {/* ── Left column ── */}
      <div className={styles.left}>
        <span id="hero-badge" className={styles.eyebrow}>New Drop·Spring 2026</span>

        <h1 className={styles.heading} aria-label="Own your story. Move with confidence">
          {WORDS.map((word, i) => (
            <span key={word + i} className={styles.wordWrap}>
              <span
                className={`${styles.word} ${word === 'Move' ? styles.emphasizedWord : ''}`}
                ref={(el) => (wordsRef.current[i] = el)}
              >
                {word}
              </span>
            </span>
          ))}
        </h1>

        <Link id="hero-cta" href="/shop" className={styles.cta}>
          Shop the Collection <span className={styles.ctaArrow}>&rarr;</span>
        </Link>
      </div>

      {/* ── Right column — 3D image ── */}
      <div className={styles.right} aria-hidden="true">
        <div ref={imageRef} className={styles.imageWrap} style={{ perspective: '800px' }}>
          <picture>
            <source media="(max-width: 900px)" srcSet="/images/Home-hero-mobile.jpeg" />
            <img src="/images/Home-hero.jpeg" alt="RedAvo Activewear" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </picture>
        </div>
      </div>

    </section>
  );
}
