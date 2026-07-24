'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, Observer } from '@/lib/gsap';
import { NAV_LINKS } from '@/constants/brand';
import Placeholder from '@/components/Placeholder/Placeholder';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './Nav.module.css';

export default function Nav() {
  const navRef = useRef(null);
  const { cartCount } = useCart();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  useGSAP(() => {
    // Show nav on scroll, hide when back at top
    ScrollTrigger.create({
      start: 'top -50px', // Trigger when user scrolls down 50px
      onEnter: () => {
        navRef.current?.classList.add(styles.scrolled);
      },
      onLeaveBack: () => {
        navRef.current?.classList.remove(styles.scrolled);
      },
    });
  }, { scope: navRef });

  return (
    <>
      <nav ref={navRef} className={styles.nav} role="navigation" aria-label="Main navigation">
        <div className={styles.inner}>
          {/* Logo */}
          <div className={styles.logoWrap}>
            <Link href="/">
              <Placeholder label="/images/logo3.png" subtitle="RedAvo Activewear Logo" className={styles.logo} />
            </Link>
          </div>

          {/* Centre links */}
          <ul className={styles.links} role="menubar">
            {NAV_LINKS.map((link) => (
              <li key={link.href} role="none">
                <Link href={link.href} className={styles.link} role="menuitem">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Icons */}
          <div className={styles.icons}>
            {showSearch ? (
              <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className={styles.searchInput}
                />
                <button type="button" className={styles.closeSearch} onClick={() => setShowSearch(false)}>✕</button>
              </form>
            ) : (
              <button className={styles.iconBtn} aria-label="Search" id="nav-search" onClick={() => setShowSearch(true)}>
                <SearchIcon />
              </button>
            )}
            <Link href="/cart" className={styles.iconBtn} aria-label="Cart" id="nav-cart">
              <CartIcon />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </Link>
            <button 
              className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`} 
              aria-label="Open menu" 
              id="nav-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.mobileMenuContent} onClick={e => e.stopPropagation()}>
            <div className={styles.mobileMenuHeader}>
              <button className={styles.closeMobileMenu} onClick={() => setIsMobileMenuOpen(false)}>✕</button>
            </div>
            <ul className={styles.mobileLinks}>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className={styles.mobileLink} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
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
