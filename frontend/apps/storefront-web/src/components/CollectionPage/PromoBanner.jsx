'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CollectionPage.module.css';

export default function PromoBanner() {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.promo-text-wrap',
      { yPercent: 30, opacity: 0 },
      {
        yPercent: 0, opacity: 1, duration: 1,
        scrollTrigger: { trigger: ref.current, start: 'top 80%' },
      }
    );
    gsap.fromTo('.promo-img',
      { scale: 1.12 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      }
    );
  }, { scope: ref });

  return (
    <section ref={ref} className={styles.promo} aria-label="Promotional banner">
      {/* Background image with parallax */}
      <div className={`promo-img ${styles.promoImg}`}>
        <Image
          src="/images/collection3.png"
          alt="Red Avo lifestyle – woman in activewear"
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
        />
      </div>

      {/* Overlay removed */}

      {/* Content */}
      <div className={`promo-text-wrap ${styles.promoContent}`}>
        <span className={styles.promoEyebrow}>The Red Avo Way</span>
        <h2 className={styles.promoHeading}>
          MOVE FREELY.<br />
          <span className={styles.promoHeadingAccent}>LOOK CONFIDENT.</span>
        </h2>
        <p className={styles.promoSub}>
          Every stitch made with purpose. Every collection built for her.
        </p>
        <Link href="/shop" className={`btn-pill ${styles.promoBtn}`} id="promo-explore">
          Explore Collection
        </Link>
      </div>
    </section>
  );
}
