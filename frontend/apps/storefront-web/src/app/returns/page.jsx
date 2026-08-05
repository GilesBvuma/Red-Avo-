﻿'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from '../info.module.css';

export default function ReturnsPage() {
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
            <span>Returns & Exchanges</span>
          </nav>
          <h1 className={styles.heading}>Returns & Exchanges</h1>
          <div className={styles.card}>
            <ul className={styles.text} style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li>Returns must be within 10 days of receipt.</li>
              <li>Returned items must be clean, not worn and not washed.</li>
              <li>Returned items must not have any dirt marks, make-up or stains.</li>
              <li>Returned items must be returned in original package with all tags attached as received.</li>
              <li>Allow 10 working days to receive, process and confirm your exchange item or refund amount.</li>
              <li>All sale items are final, no returns accepted.</li>
              <li>Returned items courier costs are paid for by the customer unless if an error of sizing, colour or selected item originated from RedAvo Activewear.</li>
            </ul>
            <div className={styles.section} style={{ marginTop: '2rem' }}>
              <h2 className={styles.sectionHeading}>Returns address is:</h2>
              <p className={styles.text}>
                RedAvo Activewear<br />
                Gate 3<br />
                Borrowdale Racecourse<br />
                Borrowdale<br />
                Harare
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
