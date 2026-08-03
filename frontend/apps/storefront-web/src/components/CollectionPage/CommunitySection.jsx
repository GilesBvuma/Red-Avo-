'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CollectionPage.module.css';



export default function CommunitySection() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.community-label, .community-title, .community-sub',
      { yPercent: 35, opacity: 0 },
      {
        yPercent: 0, opacity: 1, stagger: 0.12, duration: 0.75,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' },
      }
    );
    gsap.fromTo('.community-social-btn',
      { yPercent: 25, opacity: 0 },
      {
        yPercent: 0, opacity: 1, stagger: 0.09, duration: 0.7,
        scrollTrigger: { trigger: '.community-socials', start: 'top 88%' },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.community} aria-label="Community and lifestyle">
      <div className={styles.communityInner}>
        <span className={`section-label community-label`}>The Community</span>
        <h2 className={`community-title ${styles.communityTitle}`}>
          Join the Movement
        </h2>
        <p className={`community-sub ${styles.communitySub}`}>
          Real women. Real motion. Tag us on our handles to be featured.
        </p>

        <div className={`community-socials ${styles.communitySocials}`}>
          <a href="https://www.instagram.com/redavo.activewear?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className={`community-social-btn ${styles.socialBigBtn}`}>
            INSTAGRAM
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className={`community-social-btn ${styles.socialBigBtn}`}>
            FACEBOOK
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className={`community-social-btn ${styles.socialBigBtn}`}>
            TIKTOK
          </a>
        </div>
      </div>
    </section>
  );
}
