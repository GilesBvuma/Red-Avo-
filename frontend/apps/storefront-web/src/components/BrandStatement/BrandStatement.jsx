'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Placeholder from '@/components/Placeholder/Placeholder';
import styles from './BrandStatement.module.css';

export default function BrandStatement() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Main text scales up scrubbed to scroll
    gsap.fromTo(
      '.brand-main-text',
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          end: 'top 30%',
          scrub: 1,
        },
      }
    );

    // Sub text fades up
    gsap.fromTo(
      '.brand-sub',
      { yPercent: 40, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.brand-sub',
          start: 'top 88%',
        },
      }
    );

    // IMAGE_6 circle drifts up and fades in
    gsap.fromTo(
      '.brand-image-circle',
      { yPercent: 20, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.brand-image-circle',
          start: 'top 85%',
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section id="brand-statement" ref={sectionRef} className={styles.section} aria-labelledby="brand-heading">
      {/* Blob bg */}
      <div className={styles.blobBg} aria-hidden="true" />

      {/* Faded avocado watermark */}
      <div className={styles.avoWatermark} aria-hidden="true">🥑</div>

      <div className={styles.inner}>
        {/* Large display text with image embedded in "Q" */}
        <div
          id="brand-heading"
          className={`${styles.mainText} brand-main-text`}
          aria-label="UNMATCHED QUALITY"
        >
          <span>UNMATCHED</span>
          <br />
          <span>
            {/* Q replaced by image circle */}
            <span className={`${styles.imgCircle} brand-image-circle`}>
              <Placeholder label="/images/fabric-detail.jpg" subtitle="Fabric detail" />
            </span>
            UALITY
          </span>
        </div>

        <p className={`${styles.subText} brand-sub`}>
          At RedAvo Activewear, every stitch is a commitment to her movement.
          <br />
          Premium fabric. Fearless design.
        </p>
      </div>
    </section>
  );
}
