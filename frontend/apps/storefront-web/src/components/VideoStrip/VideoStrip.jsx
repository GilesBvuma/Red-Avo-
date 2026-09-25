'use client';

import Link from 'next/link';
import Image from 'next/image';
import MotionButton from '@/components/ui/MotionButton/MotionButton';
import styles from './VideoStrip.module.css';

export default function VideoStrip() {
  return (
    <section className={styles.hero} aria-label="Spring Collection">
      <div className={styles.heroContainer}>
        <div className={styles.left}>
          <span className={styles.eyebrow}>Spring 2026</span>
          <h2 className={styles.heading}>New Spring Collection</h2>
          <p className={styles.desc}>
            Refresh your wardrobe with our latest activewear pieces. Designed to move with you, engineered for peak performance.
          </p>
          <div className={styles.btnWrapper}>
            <MotionButton href="/shop?q=new-arrivals" label="Shop the Collection" />
          </div>
        </div>
      </div>

      <div className={styles.right} aria-hidden="true">
        <div className={styles.imageWrap}>
          <Image 
            src="/images/sprin3.png" 
            alt="Spring Collection" 
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            className={styles.desktopOnly}
          />
          <video 
            src="/videos/RedAvo Blossom collection 2.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className={styles.mobileOnly}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </section>
  );
}
