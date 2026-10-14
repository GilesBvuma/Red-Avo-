'use client';

import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import styles from './NewsletterFeatures.module.css';

const FEATURES = [
  { icon: '🚚', title: 'Fast Shipping', sub: 'Orders dispatched within 24h' },
  { icon: '✨', title: 'Premium Materials', sub: 'Crafted for performance & feel' },
  { icon: '↩', title: 'Easy Returns', sub: '30-day hassle-free returns' },
  { icon: '🔒', title: 'Secure Checkout', sub: 'End-to-end encrypted payments' },
];

export default function NewsletterFeatures() {
  const containerRef = useRef(null);
  const [email, setEmail] = useState('');
  const [subDone, setSubDone] = useState(false);

  useGSAP(() => {
    gsap.fromTo(
      '.nl-fade',
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
      }
    );

    gsap.fromTo(
      '.nl-feature-item',
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: `.${styles.footerFeatures}`,
          start: 'top 90%',
        },
      }
    );
  }, { scope: containerRef });

  const handleSubscribe = (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubDone(true);
    setEmail('');
    setTimeout(() => setSubDone(false), 4000);
  };

  return (
    <div ref={containerRef} className={styles.wrapper}>
      {/* ── NEWSLETTER ── */}
      <section className={styles.newsletter} aria-labelledby="home-newsletter-heading">
        <span className={`section-label ${styles.newsletterLabel} nl-fade`}>
          Stay Connected
        </span>
        <h2 id="home-newsletter-heading" className={`${styles.newsletterTitle} nl-fade`}>
          Join Our Community
        </h2>
        <p className={`${styles.newsletterSub} nl-fade`}>
          Be the first to hear about new drops, exclusive offers, and behind-the-scenes stories.
        </p>

        <form
          className={`${styles.newsletterForm} nl-fade`}
          onSubmit={handleSubscribe}
          role="form"
          aria-label="Email newsletter signup"
        >
          <input
            className={styles.newsletterInput}
            type="email"
            placeholder={subDone ? "You're in!" : 'your@email.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="home-newsletter-email"
            aria-label="Email address"
            required
          />
          <button
            type="submit"
            className={styles.newsletterBtn}
            id="home-newsletter-submit"
            aria-label="Subscribe to newsletter"
          >
            {subDone ? 'Subscribed' : 'Subscribe'}
          </button>
        </form>
      </section>

      {/* ── FOOTER FEATURES / TRUST BADGES ── */}
      <div className={styles.footerFeatures} aria-label="Shopping benefits">
        {FEATURES.map((f) => (
          <div key={f.title} className={`${styles.footerFeature} nl-feature-item`}>
            <div className={styles.footerFeatureIcon} aria-hidden="true">
              {f.icon}
            </div>
            <p className={styles.footerFeatureTitle}>{f.title}</p>
            <p className={styles.footerFeatureSub}>{f.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
