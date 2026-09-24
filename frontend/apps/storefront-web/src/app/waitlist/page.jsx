'use client';

import React, { useState } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import FloatingLines from '@/components/FloatingLines/FloatingLines';
import styles from './waitlist.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const INTEREST_OPTIONS = [
  'Leggings & Tights',
  'Sports Bras',
  'Matching Sets',
  'Jackets & Hoodies',
  'New Drop Alerts',
  'Everything RedAvo',
];

export default function WaitlistPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | already | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === 'ok') setStatus('success');
      else if (data.status === 'already_joined') setStatus('already');
      else { setStatus('error'); setErrorMsg(data.message || 'Something went wrong.'); }
    } catch {
      setStatus('error');
      setErrorMsg('Connection error. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      <Nav />

      {/* Animated background */}
      <div className={styles.bg} aria-hidden="true">
        <FloatingLines
          enabledWaves={['middle', 'top', 'bottom']}
          lineCount={10}
          lineDistance={7}
          bendRadius={10}
          bendStrength={-2.5}
          interactive={false}
          parallax={true}
          animationSpeed={1.8}
          linesGradient={['#8F0D13', '#C0392B', '#4a1a1a']}
        />
      </div>

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.badge}>Founding Member</div>
          <h1 className={styles.heading}>
            Be first.<br />
            <span className={styles.accent}>Always.</span>
          </h1>
          <p className={styles.sub}>
            Join the RedAvo inner circle. Get early access to every drop,
            founding-member pricing, and exclusive stories — before anyone else.
          </p>
        </section>

        {/* Form card */}
        <div className={styles.card}>
          {status === 'success' ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>
                <img src="/images/logo2.png" alt="RedAvo" width={64} height={64} style={{ objectFit: 'contain' }} />
              </div>
              <h2 className={styles.successTitle}>You're in.</h2>
              <p className={styles.successText}>
                We'll hit you first when the next drop goes live.
                Tell a friend who moves with purpose.
              </p>
              <div className={styles.shareLine}>
                <span>Share</span>
                <a
                  href="https://wa.me/?text=I%20just%20joined%20the%20RedAvo%20waitlist%20%F0%9F%A5%91%20%E2%80%94%20get%20early%20access%20at%20redavo.co.zw%2Fwaitlist"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.shareBtn}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ) : status === 'already' ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>✅</div>
              <h2 className={styles.successTitle}>Already on the list!</h2>
              <p className={styles.successText}>
                You're already registered. We'll reach out when the next drop drops.
              </p>
            </div>
          ) : (
            <>
              <h2 className={styles.cardTitle}>Reserve your spot</h2>
              <p className={styles.cardSub}>Limited founding-member spots. No spam. Ever.</p>

              <form className={styles.form} onSubmit={handleSubmit} id="waitlist-form">
                {status === 'error' && (
                  <p className={styles.errorMsg}>{errorMsg}</p>
                )}

                <div className={styles.field}>
                  <label htmlFor="waitlist-name">Full Name *</label>
                  <input
                    id="waitlist-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="waitlist-email">Email Address *</label>
                  <input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="waitlist-phone">WhatsApp / Phone <span className={styles.optional}>(optional)</span></label>
                  <input
                    id="waitlist-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+263 ..."
                    value={form.phone}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="waitlist-interest">What are you most excited about?</label>
                  <select
                    id="waitlist-interest"
                    name="interest"
                    value={form.interest}
                    onChange={handleChange}
                    className={styles.input}
                  >
                    <option value="">Choose one...</option>
                    {INTEREST_OPTIONS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <button
                  id="waitlist-submit"
                  type="submit"
                  className={styles.submitBtn}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <span className={styles.spinner} />
                  ) : (
                    'Join the Waitlist →'
                  )}
                </button>

                <p className={styles.legalNote}>
                  By joining, you agree to receive RedAvo drop announcements. Unsubscribe any time.
                </p>
              </form>
            </>
          )}
        </div>

        {/* Social proof strip */}
        <div className={styles.proofStrip}>
          <div className={styles.proofItem}>
            <span className={styles.proofNum}>100%</span>
            <span className={styles.proofLabel}>Local Brand</span>
          </div>
          <div className={styles.proofDivider} />
          <div className={styles.proofItem}>
            <span className={styles.proofNum}>First</span>
            <span className={styles.proofLabel}>Drop Access</span>
          </div>
          <div className={styles.proofDivider} />
          <div className={styles.proofItem}>
            <span className={styles.proofNum}>0</span>
            <span className={styles.proofLabel}>Spam. Ever.</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
