'use client';

import { useState } from 'react';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import styles from './wishlist.module.css';

export default function WishlistPage() {
  const { isLoggedIn, customer, loading: authLoading, sendOtp, verifyOtp } = useAuth();
  const { products, wishlistIds, toggleWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();

  // ── OTP login form state ──────────────────────────────────────────────────
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [step, setStep]           = useState('email'); // 'email' | 'otp'
  const [formError, setFormError] = useState('');
  const [sending, setSending]     = useState(false);
  const [cartMsg, setCartMsg]     = useState({});

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setFormError('Enter a valid email address.'); return; }
    setSending(true);
    setFormError('');
    try {
      await sendOtp(email.trim().toLowerCase());
      setStep('otp');
    } catch {
      setFormError('Could not send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) { setFormError('Enter the OTP from your email.'); return; }
    setSending(true);
    setFormError('');
    try {
      await verifyOtp(email.trim().toLowerCase(), otp.trim());
      setStep('email');
    } catch {
      setFormError('Incorrect OTP or it has expired. Try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Always resolve to relative /uploads/ path so Next.js rewrite handles the proxy.
  // This bypasses Next.js 15's private-IP SSRF protection for localhost.
  const toRelative = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) return url;
    const idx = url.indexOf('/uploads/');
    if (idx !== -1) return url.slice(idx);
    return url;
  };

  const getImgSrc = (p, index = 0) => {
    if (index === 1) {
      const raw = p.hoverImage || (p.imageUrls && p.imageUrls[1]) || p.image || p.imageUrl;
      return toRelative(raw) || 'https://placehold.co/400x500?text=No+Image';
    }
    const raw = p.image || p.imageUrl || (p.imageUrls && p.imageUrls[0]);
    return toRelative(raw) || 'https://placehold.co/400x500?text=No+Image';
  };

  const formatPrice = (p) => {
    const num = Number(p.price);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  const handleAddToCart = (productId, btnId) => {
    addToCart(productId, 1);
    setCartMsg(prev => ({ ...prev, [productId]: true }));
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.style.transform = 'scale(0.9)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    }
    setTimeout(() => {
      setCartMsg(prev => ({ ...prev, [productId]: false }));
    }, 2000);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <>
        <Nav />
        <main className={styles.main}>
          <p className={styles.loading}>Loading your wishlist…</p>
        </main>
        <Footer />
      </>
    );
  }

  const hasItems = products.length > 0;

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.heroBar}>
          <h1 className={styles.heading}>My Wishlist</h1>
          {isLoggedIn && customer?.email && (
            <p className={styles.subheading}>Saved items for {customer.email}</p>
          )}
        </div>

        {/* ── Not logged in — inspirational message + login prompt ── */}
        {!isLoggedIn && (
          <div className={styles.guestSection}>

            {/* Inspirational panel */}
            <div className={styles.inspirationCard}>
              <div className={styles.inspIcon}>♡</div>
              <h2 className={styles.inspTitle}>Your Wishlist, Your Goals.</h2>
              <p className={styles.inspBody}>
                At RedAvo, we believe in the power of intention. Your wishlist isn't just a collection
                of products — it's a roadmap to your active lifestyle. Whether you're eyeing our latest
                activewear drop or those must-have accessories, keep track of everything that's made
                to move with you. Save your favourites, set your sights, and when the time is right,
                turn your wishlist into your personal triumph. Ready to make your next move?
              </p>
              <p className={styles.inspCta}>
                To save your wishlist please{' '}
                <button className={styles.inspLink} onClick={() => document.getElementById('wishlist-login-form')?.scrollIntoView({ behavior: 'smooth' })}>
                  login or sign up
                </button>.
              </p>
            </div>

            {/* If they have locally-saved items, show the grid */}
            {hasItems && (
              <>
                <p className={styles.guestNote}>
                  You have {wishlistIds.size} item{wishlistIds.size > 1 ? 's' : ''} saved locally — sign in below to sync them to your account.
                </p>
                <div className={styles.grid}>
                  {products.map(p => {
                    const btnId = `wishlist-add-${p.id}`;
                    return (
                      <article key={p.id} className={styles.card}>
                        <Link href={`/shop/${p.id}`} className={styles.cardImgLink}>
                          <div className={styles.cardImg}>
                            <Image 
                              src={getImgSrc(p, 0)} 
                              alt={p.name} 
                              className={`${styles.productImg} ${styles.imgPrimary}`} 
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              style={{ objectFit: 'cover' }}
                            />
                            <Image 
                              src={getImgSrc(p, 1)} 
                              alt={`${p.name} hover`} 
                              className={`${styles.productImg} ${styles.imgHover}`} 
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              style={{ objectFit: 'cover' }}
                            />
                            <button
                              className={`${styles.heartBtn} ${styles.heartBtnActive}`}
                              onClick={e => { e.preventDefault(); toggleWishlist(p.id, p); }}
                              aria-label="Remove from wishlist"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                            <button
                              id={btnId}
                              className={styles.floatingCartBtn}
                              onClick={e => { e.preventDefault(); handleAddToCart(p.id, btnId); }}
                              aria-label={`Add ${p.name} to cart`}
                            >
                              {cartMsg[p.id] ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                  <line x1="3" y1="6" x2="21" y2="6" />
                                  <path d="M16 10a4 4 0 01-8 0" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </Link>
                        <div className={styles.cardBody}>
                          <h3 className={styles.productName}>{p.name}</h3>
                          <p className={styles.productPrice}>{formatPrice(p)}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {/* Login form */}
            <div id="wishlist-login-form" className={styles.authSection}>
              <div className={styles.authCard}>
                <div className={styles.authIcon}>🔐</div>
                <h2 className={styles.authTitle}>Sign in to sync your wishlist</h2>
                <p className={styles.authSub}>
                  No password needed — we'll send a quick one-time code to your email.
                </p>

                {step === 'email' && (
                  <form className={styles.authForm} onSubmit={handleSendOtp}>
                    <input
                      className={styles.authInput}
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      id="wishlist-email"
                      aria-label="Email address"
                    />
                    {formError && <p className={styles.formError}>{formError}</p>}
                    <button className={styles.authBtn} type="submit" disabled={sending} id="wishlist-send-otp">
                      {sending ? 'Sending…' : 'Send Code'}
                    </button>
                  </form>
                )}

                {step === 'otp' && (
                  <form className={styles.authForm} onSubmit={handleVerifyOtp}>
                    <p className={styles.otpHint}>We sent a 6-digit code to <strong>{email}</strong></p>
                    <input
                      className={styles.authInput}
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      id="wishlist-otp"
                      aria-label="One-time password"
                      inputMode="numeric"
                    />
                    {formError && <p className={styles.formError}>{formError}</p>}
                    <button className={styles.authBtn} type="submit" disabled={sending} id="wishlist-verify-otp">
                      {sending ? 'Verifying…' : 'Confirm & Sign In'}
                    </button>
                    <button type="button" className={styles.authLink} onClick={() => setStep('email')}>
                      ← Use a different email
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Logged in, empty wishlist ── */}
        {isLoggedIn && wishlistCount === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>♡</div>
            <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
            <p className={styles.emptySub}>Browse the shop and tap the heart on any item to save it here.</p>
            <Link href="/shop" className={styles.shopBtn} id="wishlist-shop-cta">Shop Now →</Link>
          </div>
        )}

        {/* ── Logged in, has items ── */}
        {isLoggedIn && products.length > 0 && (
          <div className={styles.grid}>
            {products.map(p => {
              const btnId = `wishlist-add-${p.id}`;
              return (
                <article key={p.id} className={styles.card}>
                  <Link href={`/shop/${p.id}`} className={styles.cardImgLink}>
                    <div className={styles.cardImg}>
                      <Image 
                        src={getImgSrc(p, 0)} 
                        alt={p.name} 
                        className={`${styles.productImg} ${styles.imgPrimary}`} 
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                      <Image 
                        src={getImgSrc(p, 1)} 
                        alt={`${p.name} hover`} 
                        className={`${styles.productImg} ${styles.imgHover}`} 
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: 'cover' }}
                      />
                      <button
                        className={`${styles.heartBtn} ${styles.heartBtnActive}`}
                        onClick={e => { e.preventDefault(); toggleWishlist(p.id, p); }}
                        aria-label="Remove from wishlist"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <button
                        id={btnId}
                        className={styles.floatingCartBtn}
                        onClick={e => { e.preventDefault(); handleAddToCart(p.id, btnId); }}
                        aria-label={`Add ${p.name} to cart`}
                      >
                        {cartMsg[p.id] ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </Link>
                  <div className={styles.cardBody}>
                    <h3 className={styles.productName}>{p.name}</h3>
                    <p className={styles.productPrice}>{formatPrice(p)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
