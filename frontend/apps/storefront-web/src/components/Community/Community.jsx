'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

import { gsap } from '@/lib/gsap';
import { fetchCommunityPosts } from '@/lib/api';
import Image from 'next/image';
import styles from './Community.module.css';

// Always resolve to a relative /uploads path so Next.js Image works
function resolveMediaUrl(url) {
  if (!url) return 'https://placehold.co/400x400?text=RedAvo';
  if (url.startsWith('/uploads/')) return url;
  const idx = url.indexOf('/uploads/');
  if (idx !== -1) return url.slice(idx);
  return url;
}

// ── Auto-playing Media Component ─────────────────────────────────────
function GridCardMedia({ post }) {
  const [showMedia, setShowMedia] = useState(false);

  useEffect(() => {
    let interval;
    const timeout = setTimeout(() => {
      setShowMedia(true);
      interval = setInterval(() => {
        setShowMedia(prev => !prev);
      }, 5000);
    }, Math.random() * 3000 + 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Image
        src={resolveMediaUrl(post.coverImageUrl)}
        alt=""
        className={styles.cardImg}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        style={{
          objectFit: 'cover',
          opacity: showMedia ? 0 : 1,
          transition: 'opacity 0.8s ease',
          pointerEvents: showMedia ? 'none' : 'auto',
        }}
      />
      {/* Media (video or image) — always in DOM, fades in/out via opacity only */}
      {post.mediaType === 'VIDEO' ? (
        <video
          src={resolveMediaUrl(post.mediaUrl)}
          className={styles.cardImg}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: showMedia ? 1 : 0,
            transition: 'opacity 0.8s ease',
            pointerEvents: showMedia ? 'auto' : 'none',
          }}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <Image
          src={resolveMediaUrl(post.mediaUrl)}
          alt=""
          className={styles.cardImg}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          style={{
            objectFit: 'cover',
            opacity: showMedia ? 1 : 0,
            transition: 'opacity 0.8s ease',
            pointerEvents: showMedia ? 'auto' : 'none',
          }}
        />
      )}
    </>
  );
}

// ── Viewer component ────────────────────────────────────────────────
function CommunityViewer({ posts, activeIndex, onClose, onPrev, onNext }) {
  const post = posts[activeIndex];
  if (!post) return null;

  // Keyboard navigation + Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')    onClose();
      if (e.key === 'ArrowUp')   onPrev();
      if (e.key === 'ArrowDown') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const initials = post.instagramHandle.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Backdrop — clicking closes the viewer */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Panel — single component, desktop=side panel, mobile=full-screen via CSS */}
      <div
        className={styles.viewer}
        role="dialog"
        aria-modal="true"
        aria-label={`Community post by @${post.instagramHandle}`}
      >
        {/* Media */}
        <div className={styles.viewerMedia}>
          {post.mediaType === 'VIDEO' ? (
            <video
              key={post.mediaUrl}
              src={resolveMediaUrl(post.mediaUrl)}
              className={styles.viewerVideo}
              autoPlay
              muted
              loop
              controls
              playsInline
            />
          ) : (
            <div className={styles.viewerImageWrapper}>
              <Image
                key={post.mediaUrl}
                src={resolveMediaUrl(post.mediaUrl)}
                alt={`@${post.instagramHandle}`}
                className={styles.viewerImage}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Header bar with handle + close */}
          <div className={styles.viewerHeader}>
            <a
              href={`https://instagram.com/${post.instagramHandle}`}
              target="_blank"
              rel="noreferrer"
              className={styles.viewerHandle}
              aria-label={`Visit @${post.instagramHandle} on Instagram`}
            >
              <div className={styles.viewerAvatar} aria-hidden="true">{initials}</div>
              <div>
                <span className={styles.viewerHandleText}>@{post.instagramHandle}</span>
                <span className={styles.viewerHandleSub}>View on Instagram →</span>
              </div>
            </a>

            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close viewer"
            >
              ✕
            </button>
          </div>

          {/* Navigation arrows */}
          <div className={styles.navArrows}>
            <button
              className={styles.navArrow}
              onClick={onPrev}
              disabled={activeIndex === 0}
              aria-label="Previous post"
            >
              ↑
            </button>
            <button
              className={styles.navArrow}
              onClick={onNext}
              disabled={activeIndex === posts.length - 1}
              aria-label="Next post"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Community section ──────────────────────────────────────────
export default function Community() {
  const sectionRef   = useRef(null);
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  // ── Fetch posts ─────────────────────────────────────────────────
  useEffect(() => {
    fetchCommunityPosts()
      .then(data => {
        if (data) {
          const sorted = data.sort((a, b) => b.id - a.id).slice(0, 18);
          setPosts(sorted);
        }
      })
      .catch(err => console.error('Community fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── GSAP entrance animation ─────────────────────────────────────
  

  // ── Viewer handlers ─────────────────────────────────────────────
  const openViewer  = (idx)  => setActiveIndex(idx);
  const closeViewer = useCallback(() => setActiveIndex(null), []);
  const prevPost    = useCallback(() => setActiveIndex(i => Math.max(0, i - 1)), []);
  const nextPost    = useCallback(() => setActiveIndex(i => Math.min(posts.length - 1, i + 1)), [posts.length]);

  if (!loading && posts.length === 0) return null; // nothing to show

  return (
    <section
      id="community"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="community-heading"
    >
      <div className={styles.container}>
        <span className={`${styles.label} community-label`}>Our Community</span>
        <h2
          id="community-heading"
          className={`${styles.heading} community-heading`}
        >
          TAG US ON INSTAGRAM
        </h2>

        <div className={styles.grid} role="list">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.card} style={{ background: '#e5e7eb', animation: 'pulse 1.5s infinite' }} />
              ))
            : posts.map((post, idx) => (
                <article
                  key={post.id}
                  className={`${styles.card} community-card`}
                  role="listitem"
                  onClick={() => openViewer(idx)}
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && openViewer(idx)}
                  aria-label={`Community post by @${post.instagramHandle}`}
                >
                  <GridCardMedia post={post} />

                  <div className={styles.centerIconWrap} aria-hidden="true">
                    <svg
                      className={styles.instagramIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>

                  <div className={styles.cardOverlay} aria-hidden="true">
                  </div>

                  <a 
                    href={`https://instagram.com/${post.instagramHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.handleBadge}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Visit @${post.instagramHandle} on Instagram`}
                  >
                    @{post.instagramHandle}
                  </a>
                </article>
              ))
          }
        </div>
      </div>

      {/* Story-style viewer */}
      {activeIndex !== null && (
        <CommunityViewer
          posts={posts}
          activeIndex={activeIndex}
          onClose={closeViewer}
          onPrev={prevPost}
          onNext={nextPost}
        />
      )}
    </section>
  );
}
