'use client';

import { useRef } from 'react';


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
  bg = '#5E080C',
  color = '#fff',
  accentColor = 'var(--pink)',
  slant = 'cw',
  style = {},
}) {
  



  // Build three copies for seamless loop
  const copies = [0, 1, 2];

  return (
    <section
      
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
