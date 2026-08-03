'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Leaf, Dumbbell, Heart, ShieldCheck } from 'lucide-react';
import styles from './CollectionPage.module.css';

const VALUES = [
  {
    title: 'Sustainable',
    desc: 'Thoughtfully made for a better tomorrow.',
    icon: Leaf
  },
  {
    title: 'Performance',
    desc: 'Engineered to support every move.',
    icon: Dumbbell
  },
  {
    title: 'Inclusive',
    desc: 'Styles for every body, every journey.',
    icon: Heart
  },
  {
    title: 'Quality',
    desc: 'Premium fabrics. Built to last.',
    icon: ShieldCheck
  }
];

export default function BrandValues() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo('.value-card-anim',
      { y: 40, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' }
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={styles.valuesSection} aria-label="Brand Values">
      <div className={styles.valuesGrid}>
        {VALUES.map((val, idx) => {
          const Icon = val.icon;
          return (
            <div key={idx} className={`${styles.valueCard} value-card-anim`}>
              <div className={styles.valueIconWrap}>
                <Icon size={42} strokeWidth={1.5} />
              </div>
              <h3 className={styles.valueTitle}>{val.title}</h3>
              <p className={styles.valueDesc}>{val.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
