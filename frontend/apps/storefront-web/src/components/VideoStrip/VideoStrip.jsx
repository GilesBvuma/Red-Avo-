'use client';

import styles from './VideoStrip.module.css';

export default function VideoStrip() {
  return (
    <section
      id="video-strip"
      className={styles.section}
      aria-label="Brand video"
    >
      <div className={styles.bg}>
        <video
          src="/videos/brand-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          className={styles.video}
        />
      </div>
    </section>
  );
}
