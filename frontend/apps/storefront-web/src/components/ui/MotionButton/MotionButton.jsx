'use client';

import Link from 'next/link';
import styles from './MotionButton.module.css';

export default function MotionButton({ label, href, id }) {
  return (
    <Link id={id} href={href} className={styles.cta}>
      {/* Expanding red circle — sits behind icon & text via z-index */}
      <span className={styles.ctaCircle} aria-hidden="true" />

      {/* Arrow icon */}
      <span className={styles.ctaIcon} aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>

      {/* Label — grows the button to fit */}
      <span className={styles.ctaText}>{label}</span>
    </Link>
  );
}
