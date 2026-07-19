'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import styles from './CollectionPage.module.css';

const FEATURES = [
  {
    id: 'shipping',
    icon: '🚚',
    title: 'Free Shipping',
    desc: 'Complimentary delivery on all orders over $50. Fast, reliable, and trackable.',
  },
  {
    id: 'quality',
    icon: '✦',
    title: 'Premium Quality',
    desc: 'Designed with performance fabrics that sculpt, support, and last season after season.',
  },
  {
    id: 'returns',
    icon: '↩',
    title: 'Easy Returns',
    desc: 'Not in love? Return or exchange within 30 days, no questions asked.',
  },
  {
    id: 'secure',
    icon: '🔒',
    title: 'Secure Checkout',
    desc: 'Your data is fully protected with end-to-end encryption on every transaction.',
  },
];

export default function CollectionFeatures() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.feature-card',
      { yPercent: 30, opacity: 0 },
      {
        yPercent: 0, opacity: 1, stagger: 0.14, duration: 0.75,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' },
      }
    );
    gsap.fromTo('.features-label, .features-title',
      { yPercent: 40, opacity: 0 },
      {
        yPercent: 0, opacity: 1, stagger: 0.12, duration: 0.7,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.features} aria-label="Why shop with us">
      <div className={styles.featuresInner}>
        <span className={`section-label features-label`}>Why Choose Us</span>
        <h2 className={`features-title ${styles.featuresTitle}`}>Shop With Confidence</h2>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <article key={f.id} className={`feature-card ${styles.featureCard}`}>
              <div className={styles.featureIconWrap} aria-hidden="true">
                <span className={styles.featureIcon}>{f.icon}</span>
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
