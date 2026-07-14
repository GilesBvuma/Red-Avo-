'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './VideoStrip.module.css';

export default function VideoStrip() {
  const sectionRef = useRef(null);
  const bgRef      = useRef(null);

  useGSAP(() => {
    // Parallax: inner bg moves at ~60% of scroll speed
    gsap.to(bgRef.current, {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    // Overlay text fades and scales in
    gsap.fromTo(
      '.video-overlay-text',
      { opacity: 0, scale: 0.88 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section
      id="video-strip"
      ref={sectionRef}
      className={styles.section}
      aria-label="Brand video"
    >
      {/* Parallax background */}
      <div ref={bgRef} className={styles.bg}>
        <video
          src="/videos/brand-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          className={styles.video}
        />
      </div>

      {/* Overlay text */}
      <p className={`${styles.overlayText} video-overlay-text`}>
        MOVE WITH CONFIDENCE
      </p>
    </section>
  );
}
