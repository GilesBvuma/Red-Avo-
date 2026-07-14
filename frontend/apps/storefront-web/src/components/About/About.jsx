'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Placeholder from '@/components/Placeholder/Placeholder';
import styles from './About.module.css';

export default function About() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Image slides in from left
    gsap.fromTo(
      '.about-img',
      { xPercent: -15, opacity: 0 },
      {
        xPercent: 0, opacity: 1, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      }
    );

    // Text slides in from right, staggered
    gsap.fromTo(
      ['.about-eyebrow', '.about-heading', '.about-text'],
      { xPercent: 12, opacity: 0 },
      {
        xPercent: 0, opacity: 1, stagger: 0.15, duration: 0.75, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%' },
        delay: 0.1,
      }
    );
  }, { scope: sectionRef });

  return (
    <section id="about" ref={sectionRef} className={styles.section} aria-labelledby="about-heading">
      {/* Decorative avocado icons */}
      <span className={`${styles.avoDeco} ${styles.d1}`} aria-hidden="true">🥑</span>
      <span className={`${styles.avoDeco} ${styles.d2}`} aria-hidden="true">🥑</span>
      <span className={`${styles.avoDeco} ${styles.d3}`} aria-hidden="true">🥑</span>
      <div className={`${styles.dots} ${styles.dots1}`} aria-hidden="true" />
      <div className={`${styles.dots} ${styles.dots2}`} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Left — blob-clipped image */}
        <div className={`${styles.imageWrap} about-img`}>
          <Placeholder label="/images/about-lifestyle.PNG" subtitle="Brand lifestyle image" />
        </div>

        {/* Right — text */}
        <div className={styles.textCol}>
          <p className={`${styles.eyebrow} about-eyebrow`}>Our Story</p>
          <h2 id="about-heading" className={`${styles.heading} about-heading`}>
            BORN FROM<br />PASSION.
          </h2>
          <p className={`${styles.text} about-text`}>
            Red Avo was built for women who move with purpose. Authentic in design.
            Fearless in motion. Every piece we create carries the spirit of every woman
            who refuses to be ordinary — on the court, the track, or the street.
          </p>
        </div>
      </div>
    </section>
  );
}
