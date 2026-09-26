'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/constants/brand';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './Nav.module.css';
import NotificationBar from './NotificationBar';

export default function Nav() {
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === '/';
  const DARK_NAV_PAGES = ['/', '/shop', '/collections', '/cart', '/our-story'];
  const isLightNav = !DARK_NAV_PAGES.includes(pathname);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll state for direction-aware smart navbar
  const [scrollState, setScrollState] = useState({
    visible: true,
    isScrolled: false,
    atTop: true,
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 10; // min scroll px delta to trigger change

    const updateScrollState = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      // When near top of page (0-15px)
      if (currentScrollY <= 15) {
        setScrollState((prev) => {
          if (prev.visible && !prev.isScrolled && prev.atTop) return prev;
          return { visible: true, isScrolled: false, atTop: true };
        });
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      // If scrolling threshold reached
      if (Math.abs(diff) >= SCROLL_THRESHOLD) {
        const isDown = diff > 0;
        setScrollState((prev) => {
          const nextVisible = !isDown;
          const nextScrolled = true;
          const nextAtTop = false;
          if (prev.visible === nextVisible && prev.isScrolled === nextScrolled && prev.atTop === nextAtTop) {
            return prev; // Prevents unnecessary React re-renders!
          }
          return { visible: nextVisible, isScrolled: nextScrolled, atTop: nextAtTop };
        });
        lastScrollY = currentScrollY;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    // Run initial check
    updateScrollState();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // Keep navbar visible if mobile menu or search input is open
  const isNavbarVisible = scrollState.visible || isMobileMenuOpen || showSearch;

  const SearchComponent = () => (
    showSearch ? (
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
      <button className={styles.iconBtn} aria-label="Search" onClick={() => setShowSearch(true)}>
        <SearchIcon />
      </button>
    )
  );

  return (
    <header className={styles.headerContainer}>
      {/* Announcement bar displayed ONLY on homepage, in normal document flow */}
      {isHomePage && <NotificationBar />}

      <nav 
        className={`
          ${styles.nav} 
          ${isLightNav ? styles.navLight : ''} 
          ${scrollState.isScrolled ? styles.scrolled : ''} 
          ${isHomePage && scrollState.atTop ? styles.navHomeTop : ''}
          ${!isNavbarVisible ? styles.navHidden : ''}
        `} 
        role="navigation" 
        aria-label="Main navigation"
      >
        <div className={styles.inner}>
          {/* Mobile Left Group */}
          <div className={styles.mobileLeftGroup}>
            <button 
              className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`} 
              aria-label="Open menu" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span /><span /><span />
            </button>
            <div className={styles.mobileSearch}>
              <SearchComponent />
            </div>
          </div>

          {/* Logo */}
          <div className={styles.logoWrap}>
            <Link href="/" className={styles.logoLink}>
              <Image src="/images/logo.png" alt="RedAvo Activewear Logo" width={180} height={64} className={`${styles.logo} ${styles.logoDesktop}`} priority />
              <Image src="/images/logo3.png" alt="RedAvo Activewear Logo" width={180} height={64} className={`${styles.logo} ${styles.logoMobile}`} priority />
            </Link>
          </div>

          {/* Desktop Centre links */}
          <ul className={styles.links} role="menubar">
            {NAV_LINKS.filter(link => link.label !== 'My Account').map((link) => (
              <li key={link.href} role="none">
                <Link href={link.href} className={styles.link} role="menuitem">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Icons */}
          <div className={styles.icons}>
            <div className={styles.desktopSearch}>
              <SearchComponent />
            </div>
            
            <Link href="/wishlist" className={`${styles.iconBtn} ${styles.wishlistIconBtn}`} aria-label="Wishlist" style={{ position: 'relative' }}>
              <WishlistIcon />
              {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
            </Link>
            
            <Link href="/account" className={`${styles.iconBtn} ${styles.accountIconBtn}`} aria-label="Account">
              <UserIcon />
            </Link>
            
            <Link href="/cart" className={styles.iconBtn} aria-label="Cart" style={{ position: 'relative' }}>
              <CartIcon />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </Link>
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
              {!NAV_LINKS.some(link => link.label === 'My Account') && (
                <li key="/account">
                  <Link href="/account" className={styles.mobileLink} onClick={() => setIsMobileMenuOpen(false)}>
                    My Account
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

function WishlistIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
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
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
