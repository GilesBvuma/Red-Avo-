'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from './success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get('orderRef');
  const isMock = searchParams.get('mock');

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <CheckIcon />
      </div>
      <h1>Order Confirmed!</h1>
      <p>Thank you for shopping with Red Avo.</p>
      
      {orderRef && (
        <div className={styles.orderRef}>
          <span>Order Reference:</span>
          <strong>{orderRef}</strong>
        </div>
      )}

      {isMock && (
        <div className={styles.mockAlert}>
          Note: This was a simulated PayNow checkout since you are using test integration credentials.
          The order is saved in the POS system as PENDING_PAYMENT.
        </div>
      )}

      <p className={styles.message}>
        We've received your order and will begin processing it right away. 
        You will receive an email and SMS confirmation shortly.
      </p>

      <Link href="/shop" className={styles.btn}>
        Continue Shopping
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
