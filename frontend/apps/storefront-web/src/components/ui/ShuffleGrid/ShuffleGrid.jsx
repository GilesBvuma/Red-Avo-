'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import styles from './ShuffleGrid.module.css';

/* ── Images from public/images/gallery ── */
const squareData = [
  { id: 1, src: '/images/gallery/Screenshot%202026-07-28%20220523.png' },
  { id: 2, src: '/images/gallery/Screenshot%202026-07-29%20080602.png' },
  { id: 3, src: '/images/gallery/Screenshot%202026-07-29%20080620.png' },
  { id: 4, src: '/images/gallery/Screenshot%202026-07-29%20090510.png' },
  { id: 5, src: '/images/gallery/Screenshot%202026-07-29%20111711.png' },
  { id: 6, src: '/images/gallery/Screenshot%202026-07-29%20111725.png' },
  { id: 7, src: '/images/gallery/Screenshot%202026-07-29%20111747.png' },
  { id: 8, src: '/images/gallery/Screenshot%202026-07-29%20111802.png' },
  { id: 9, src: '/images/gallery/Screenshot%202026-07-29%20111820.png' },
  { id: 10, src: '/images/gallery/Screenshot%202026-07-29%20111850.png' },
  { id: 11, src: '/images/gallery/Screenshot%202026-07-29%20111905.png' },
  { id: 12, src: '/images/gallery/Screenshot%202026-07-29%20111922.png' },
  { id: 13, src: '/images/gallery/Screenshot%202026-07-29%20111947.png' },
  { id: 14, src: '/images/gallery/Screenshot%202026-07-29%20112002.png' },
  { id: 15, src: '/images/gallery/Screenshot%202026-07-29%20112023.png' },
  { id: 16, src: '/images/gallery/Screenshot%202026-07-29%20112146.png' },
  { id: 17, src: '/images/gallery/Screenshot%202026-07-29%20112158.png' },
  { id: 18, src: '/images/gallery/Screenshot%202026-07-29%20112225.png' },
  { id: 19, src: '/images/gallery/Screenshot%202026-07-29%20112301.png' },
  { id: 20, src: '/images/gallery/Screenshot%202026-07-29%20112322.png' },
  { id: 21, src: '/images/gallery/Screenshot%202026-07-29%20112628.png' },
  { id: 22, src: '/images/gallery/Screenshot%202026-07-29%20112642.png' },
  { id: 23, src: '/images/gallery/Screenshot%202026-07-29%20112654.png' },
  { id: 24, src: '/images/gallery/Screenshot%202026-07-29%20112718.png' },
  { id: 25, src: '/images/gallery/Screenshot%202026-07-29%20112730.png' },
  { id: 26, src: '/images/gallery/Screenshot%202026-07-29%20112836.png' },
  { id: 27, src: '/images/gallery/Screenshot%202026-07-29%20112921.png' },
  { id: 28, src: '/images/gallery/Screenshot%202026-07-29%20112932.png' },
  { id: 29, src: '/images/gallery/Screenshot%202026-07-29%20113035.png' },
  { id: 30, src: '/images/gallery/Screenshot%202026-07-29%20113106.png' },
  { id: 31, src: '/images/gallery/Screenshot%202026-07-29%20113115.png' },
  { id: 32, src: '/images/gallery/Screenshot%202026-07-29%20113134.png' },
  { id: 33, src: '/images/gallery/Screenshot%202026-07-29%20113200.png' },
  { id: 34, src: '/images/gallery/Screenshot%202026-07-29%20113226.png' },
  { id: 35, src: '/images/gallery/Screenshot%202026-07-29%20113239.png' },
  { id: 36, src: '/images/gallery/Screenshot%202026-07-29%20113301.png' },
  { id: 37, src: '/images/gallery/Screenshot%202026-07-29%20113312.png' },
  { id: 38, src: '/images/gallery/Screenshot%202026-07-29%20113333.png' },
  { id: 39, src: '/images/gallery/Screenshot%202026-07-29%20113349.png' }
];

/* Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Pick 16 random images from the pool each time */
function generateSquares() {
  return shuffle(squareData).slice(0, 16);
}

function ShuffleGrid() {
  const timerRef = useRef(null);
  // Use a deterministic initial state for SSR to prevent hydration mismatch
  const [squares, setSquares] = useState(squareData.slice(0, 16));
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Shuffle immediately after hydration on the client
    setSquares(generateSquares());

    const cycle = () => {
      /* Fade out → swap → fade in */
      setFading(true);
      timerRef.current = setTimeout(() => {
        setSquares(generateSquares());
        setFading(false);
      }, 500);
      timerRef.current = setTimeout(cycle, 3000);
    };

    timerRef.current = setTimeout(cycle, 3000);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className={styles.grid}>
      {squares.map((sq) => (
        <div
          key={sq.id}
          className={`${styles.cell} ${fading ? styles.cellFade : ''}`}
          style={{ backgroundImage: `url(${sq.src})` }}
        />
      ))}
    </div>
  );
}

export default function ShuffleHero() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.hero-text-anim',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className={styles.hero}>
      {/* Left — text */}
      <div className={styles.textCol}>
        <nav className={`hero-text-anim ${styles.breadcrumb}`} aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
          <span>Our Story</span>
        </nav>
        <h1 className={`hero-text-anim ${styles.heading}`} style={{ color: '#fff' }}>
          Our Story
        </h1>
        <span className={`hero-text-anim ${styles.eyebrow}`} style={{ color: '#fff' }}>
          Authentic. Fearless. African.
        </span>
        <a href="#our-story-content" className={`hero-text-anim ${styles.cta}`}>
          Read our story
        </a>
      </div>
    </section>
  );
}
