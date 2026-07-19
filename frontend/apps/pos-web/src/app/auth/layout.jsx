'use client';

import GridMotion from '@/components/GridMotion/GridMotion';
import Image from 'next/image';
import styles from './auth.module.css';

const gridItems = [
  '/images/shop1.jpg', '/images/shop2.jpg', '/images/shop3.jpg', '/images/shop4.jpg', 
  '/images/shop5.jpg', '/images/shop6.jpg', '/images/shop7.jpg', '/images/shop8.jpg', 
  '/images/shop9.jpg', '/images/shop10.jpg', '/images/shop11.jpg', '/images/shop12.jpg', 
  '/images/shop13.jpg', '/images/shop1.jpg', '/images/shop2.jpg', '/images/shop3.jpg', 
  '/images/shop4.jpg', '/images/shop5.jpg', '/images/shop6.jpg', '/images/shop7.jpg', 
  '/images/shop8.jpg', '/images/shop9.jpg', '/images/shop10.jpg', '/images/shop11.jpg', 
  '/images/shop12.jpg', '/images/shop13.jpg', '/images/shop1.jpg', '/images/shop2.jpg'
];

export default function AuthLayout({ children }) {
  return (
    <div className={styles.authLayout}>
      <div className={styles.authLeft}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <GridMotion items={gridItems} gradientColor="#1a1a2e" />
        </div>
        <div className={styles.logoContainer}>
          <Image src="/images/logo.png" alt="Red Avo" width={300} height={300} style={{ objectFit: 'contain' }} priority />
        </div>
      </div>
      <div className={styles.authRight}>
        {children}
      </div>
    </div>
  );
}
