﻿'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from '../info.module.css';

export default function GiftCardPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        {/* Watermarks */}
        <Image
          src="/images/logo3 - footer.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark1}`}
          unoptimized={true}
        />
        <Image
          src="/images/logo3 - footer.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark2}`}
          unoptimized={true}
        />
        <Image
          src="/images/logo3 - footer.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark3}`}
          unoptimized={true}
        />
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
            <span>Gift Cards</span>
          </nav>
          <h1 className={styles.heading}>Gift Cards</h1>
          <div className={styles.card}>
            <div className={styles.giftCardVisual}>
              <video 
                src="/videos/Gift%20cards.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline 
                className={styles.giftCardVideo} 
              />
            </div>
            
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>Give the Gift of Confidence</h2>
              <p className={styles.text}>Not sure what size or color they'd prefer? A Red Avo digital gift card is the perfect way to show you care. Delivered instantly via email with instructions on how to redeem at checkout.</p>
              <p className={styles.text}>Our gift cards have no additional processing fees and never expire.</p>
            </div>
            
            <a href="/gift-card/shop" className={styles.buyBtn}>Purchase Gift Card</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
