﻿'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from '../info.module.css';

export default function ShippingPage() {
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
            <span>Shipping</span>
          </nav>
          <h1 className={styles.heading}>Shipping Information</h1>
          <div className={styles.card}>
            <ul className={styles.text} style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li>We are currently offering courier delivery services within Zimbabwe only.</li>
              <li>Kindly allow up to 5 working days for delivery in and around Zimbabwe.</li>
              <li>You may not change your shipping address once your order has been confirmed.</li>
              <li>Kindly check that your delivery address information is correct before confirming order.</li>
              <li>Refer to our <a href="/faq" className={styles.link} style={{ textDecoration: 'underline' }}>FAQs</a> for more on shipping.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
