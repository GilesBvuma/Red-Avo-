'use client';

import { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, Observer } from '@/lib/gsap';
import { NAV_LINKS } from '@/constants/brand';
import Placeholder from '@/components/Placeholder/Placeholder';
import styles from './Nav.module.css';

export default function Nav() {
  const navRef = useRef(null);

  useGSAP(() => {
    // Slide nav down from top on page load
    gsap.fromTo(
      navRef.current,
      { yPercent: -100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
    );

    // Shrink nav on scroll using ScrollTrigger
    ScrollTrigger.create({
      start: 'top -60px',
      onEnter: () => navRef.current?.classList.add(styles.scrolled),
      onLeaveBack: () => navRef.current?.classList.remove(styles.scrolled),
    });
  }, { scope: navRef });

  return (
    <nav ref={navRef} className={styles.nav} role="navigation" aria-label="Main navigation">
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <Placeholder label="/images/logo.png" subtitle="Red Avo Logo" className={styles.logo} />
        </div>

        {/* Centre links */}
        <ul className={styles.links} role="menubar">
          {NAV_LINKS.map((link) => (
            <li key={link.href} role="none">
              <a href={link.href} className={styles.link} role="menuitem">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Icons */}
        <div className={styles.icons}>
          <button className={styles.iconBtn} aria-label="Search" id="nav-search">
            <SearchIcon />
          </button>
          <button className={styles.iconBtn} aria-label="Cart" id="nav-cart">
            <CartIcon />
          </button>
          <button className={styles.iconBtn} aria-label="Account" id="nav-account">
            <UserIcon />
          </button>
          <button className={styles.hamburger} aria-label="Open menu" id="nav-menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
