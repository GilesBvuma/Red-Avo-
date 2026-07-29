'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { LOOKBOOK } from '@/constants/brand';
import Placeholder from '@/components/Placeholder/Placeholder';
import styles from './Lookbook.module.css';

export default function Lookbook() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Header
    gsap.fromTo(
      ['.lb-label', '.lb-heading'],
      { yPercent: 50, opacity: 0 },
      {
        yPercent: 0, opacity: 1, stagger: 0.15, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      }
    );

    // Grid items stagger scale-in
    gsap.fromTo(
      '.lb-item',
      { scale: 0.88, opacity: 0 },
      {
        scale: 1, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.lb-grid', start: 'top 80%' },
      }
    );
  }, { scope: sectionRef });

  return (
    <section id="lookbook" ref={sectionRef} className={styles.section} aria-labelledby="lookbook-heading">
      <div className={styles.container}>
        <span className={`${styles.label} lb-label`}>Inspiration</span>
        <h2 id="lookbook-heading" className={`${styles.heading} lb-heading`}>
          RedAvo Fits Lookbook
        </h2>

        <div className={`${styles.grid} lb-grid`}>
          {LOOKBOOK.map((item) => (
            <div
              key={item.id}
              className={`${styles.item} ${item.large ? styles.large : ''} lb-item`}
            >
              <Placeholder label={item.placeholder} subtitle={item.subtitle} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
