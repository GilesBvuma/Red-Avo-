'use client';

import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import MyAccountWidget from '@/components/Footer/MyAccountWidget';
import Image from 'next/image';
import styles from './AccountPage.module.css';

export default function AccountPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark1}`}
          unoptimized={true}
        />
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark2}`}
          unoptimized={true}
        />
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.heading}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in or create an account to view your orders.</p>
            <MyAccountWidget theme="light" hideTitle={true} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
