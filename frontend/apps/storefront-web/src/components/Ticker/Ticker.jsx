'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import styles from './Ticker.module.css';

/**
 * Reusable horizontal marquee ticker.
 * @param {string}  text      - The repeating text content
 * @param {'ltr'|'rtl'} direction - Scroll direction
 * @param {string}  bg        - Background colour (CSS value)
 * @param {string}  color     - Text colour
 * @param {string}  accentColor - Dot separator colour
 */
export default function Ticker({
  text,
  direction = 'ltr',
  bg = 'var(--navy)',
  color = '#fff',
  accentColor = 'var(--pink)',
  slant = 'cw',
  style = {},
}) {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Strip slides in from one side on ScrollTrigger enter
    gsap.fromTo(
      sectionRef.current,
      { xPercent: direction === 'ltr' ? -8 : 8, opacity: 0 },
      {
        xPercent: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 90%',
        },
      }
    );
  }, { scope: sectionRef });

  // Build three copies for seamless loop
  const copies = [0, 1, 2];

  return (
    <section
      ref={sectionRef}
      className={`${styles.ticker} ${slant === 'ccw' ? styles.ccw : ''}`}
      style={{ background: bg, ...style }}
      aria-label="Brand marquee"
    >
      <div
        className={`${styles.track} ${direction === 'rtl' ? styles.rtl : ''}`}
        aria-hidden="true"
      >
        {copies.map((i) => (
          <span key={i} className={styles.text} style={{ color }}>
            {text.split('·').map((segment, j, arr) => (
              <span key={j}>
                {segment.trim()}
                {j < arr.length - 1 && (
                  <span className={styles.dot} style={{ color: accentColor }}> · </span>
                )}
              </span>
            ))}
            &nbsp;&nbsp;
          </span>
        ))}
      </div>
    </section>
  );
}
