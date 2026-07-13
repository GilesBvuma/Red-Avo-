'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Placeholder from '@/components/Placeholder/Placeholder';
import { NAV_LINKS } from '@/constants/brand';
import styles from './Footer.module.css';

export default function Footer() {
  const footerRef = useRef(null);
  const [email, setEmail]     = useState('');
  const [subDone, setSubDone] = useState(false);

  useGSAP(() => {
    // Watermark text drifts up slightly on mount for a living feel
    gsap.fromTo('.footer-watermark', { yPercent: 6, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger: footerRef.current, start: 'top 90%' },
    });
    gsap.fromTo('.footer-col', { yPercent: 20, opacity: 0 }, {
      yPercent: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: footerRef.current, start: 'top 90%' },
    });
  }, { scope: footerRef });

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) return;
    setSubDone(true);
    setEmail('');
    setTimeout(() => setSubDone(false), 4000);
  };

  return (
    <footer id="footer" ref={footerRef} className={styles.footer} role="contentinfo">
      {/* Large background watermark */}
      <div className={`${styles.watermark} footer-watermark`} aria-hidden="true">
        RED AVO
      </div>

      <div className={styles.inner}>
        {/* Top row */}
        <div className={styles.top}>
          {/* Column 1 — Logo & tagline */}
          <div className={`${styles.col} footer-col`}>
            <div className={styles.logoWrap}>
              <Placeholder label="/images/logo.png" subtitle="Red Avo Logo" className={styles.logo} />
            </div>
            <p className={styles.tagline}>Authentic · Fearless</p>
            <div className={styles.hearts} aria-hidden="true">
              <span>🥑</span>
              <span style={{ color: 'var(--pink)', opacity: 0.6 }}>♥</span>
              <span>🥑</span>
              <span style={{ color: 'var(--pink)', opacity: 0.6 }}>♥</span>
              <span>🥑</span>
            </div>
          </div>

          {/* Column 2 — Nav */}
          <nav className={`${styles.col} footer-col`} aria-label="Footer navigation">
            <p className={styles.colLabel}>Navigate</p>
            <ul className={styles.navList}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.navLink}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3 — Subscribe */}
          <div className={`${styles.col} footer-col`}>
            <p className={styles.colLabel}>Stay in the loop</p>
            <div className={styles.subForm} role="form" aria-label="Email subscription">
              <input
                className={styles.subInput}
                type="email"
                placeholder={subDone ? "You're subscribed 🥑" : 'your@email.com'}
                id="footer-email"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />
              <button
                className={styles.subBtn}
                aria-label="Subscribe"
                id="footer-sub-btn"
                onClick={handleSubscribe}
              >
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bar}>
          <p className={styles.copy}>© 2025 Red Avo Sportswear. All rights reserved.</p>
          <div className={styles.barLinks}>
            <a href="#" className={styles.barLink}>Privacy Policy</a>
            <a href="#" className={styles.barLink}>Terms of Service</a>
            <a href="#" className={styles.barLink}>Size Guide</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
