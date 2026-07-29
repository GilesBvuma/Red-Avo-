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
              <Placeholder label="/images/logo.png" subtitle="RedAvo Activewear Logo" className={styles.logo} />
            </div>
            <p className={styles.tagline}>Authentic. Fearless</p>
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

          {/* Column 3 — Support */}
          <nav className={`${styles.col} footer-col`} aria-label="Support navigation">
            <p className={styles.colLabel}>Support</p>
            <ul className={styles.navList}>
              <li><a href="/faq" className={styles.navLink}>FAQ</a></li>
              <li><a href="/size-chart" className={styles.navLink}>Sizes Chart</a></li>
              <li><a href="/gift-card" className={styles.navLink}>GIFT CARD</a></li>
              <li><a href="/returns" className={styles.navLink}>Returns & Exchanges</a></li>
              <li><a href="/shipping" className={styles.navLink}>Shipping</a></li>
              <li><a href="/contact" className={styles.navLink}>Contact Us</a></li>
            </ul>
          </nav>

          {/* Column 4 — Newsletter */}
          <div className={`${styles.col} footer-col`}>
            <p className={styles.colLabel}>Newsletter</p>
            <p className={styles.navLink} style={{marginBottom: '1rem', lineHeight: '1.4'}}>
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <div className={styles.subForm}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className={styles.subInput} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <button onClick={handleSubscribe} className={styles.subBtn}>
                {subDone ? 'Done' : 'Join'}
              </button>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className={styles.bar}>
          <p className={styles.copy}>© 2025 RedAvo Activewear. All rights reserved.</p>
          <div className={styles.barLinks}>
            <a href="/privacy" className={styles.barLink}>Privacy Policy & Terms</a>
            <a href="/size-chart" className={styles.barLink}>Size Guide</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
