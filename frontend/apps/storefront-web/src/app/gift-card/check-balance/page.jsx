﻿'use client';

import { useState } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from '../../info.module.css';
import Image from 'next/image';

export default function CheckBalancePage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/gift-cards/validate/${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <Image src="/images/logo3 - footer.png" alt="" width={800} height={800} className={`${styles.watermark} ${styles.watermark1}`} unoptimized />
        <Image src="/images/logo3 - footer.png" alt="" width={800} height={800} className={`${styles.watermark} ${styles.watermark2}`} unoptimized />
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
            <a href="/gift-card">Gift Cards</a>
            <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
            <span>Check Balance</span>
          </nav>
          <h1 className={styles.heading}>Check Gift Card Balance</h1>

          <div className={styles.card}>
            <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.section}>
                <label htmlFor="gc-code" style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  Enter your gift card code
                </label>
                <input
                  id="gc-code"
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="GC-XXXX-XXXX-XXXX"
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e5e5e5',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    color: '#2a2a28',
                    background: '#fafafa',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button type="submit" className={styles.buyBtn} disabled={loading} style={{ width: 'fit-content' }}>
                {loading ? 'Checking...' : 'Check Balance'}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: '20px', background: '#fff0f0', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', padding: '14px 16px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            {result && (
              <div style={{ marginTop: '28px', background: result.valid ? '#f0fdf4' : '#fff0f0', border: `1px solid ${result.valid ? '#86efac' : '#fca5a5'}`, borderRadius: '12px', padding: '24px' }}>
                {result.valid ? (
                  <>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#166534', fontSize: '1rem' }}>âœ“ Valid Gift Card</p>
                    <p style={{ margin: '0 0 4px', color: '#2a2a28', fontSize: '0.95rem' }}>
                      Remaining Balance: <strong style={{ fontSize: '1.4rem', color: '#8F0D13' }}>${Number(result.remainingBalance).toFixed(2)}</strong>
                    </p>
                    <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#888' }}>This gift card never expires.</p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#b91c1c', fontSize: '1rem' }}>
                      {result.status === 'PENDING' ? 'â³ Card Pending' :
                       result.status === 'REDEEMED' ? 'Gift Card Fully Redeemed' :
                       result.status === 'VOIDED' ? 'Gift Card Voided' :
                       'Invalid Code'}
                    </p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      {result.status === 'PENDING' ? 'Your card is being processed and will be active shortly.' :
                       result.status === 'NOT_FOUND' ? 'No gift card found with that code. Please check and try again.' :
                       'This gift card can no longer be used.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
