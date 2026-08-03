'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './ScrollExpandMedia.module.css';

/**
 * ScrollExpandMedia — scroll-driven hero that expands a media element as the
 * user scrolls, then reveals the children content beneath.
 *
 * Props
 * ─────
 * mediaType      'video' | 'image'   (default 'video')
 * mediaSrc       path/URL to the video or image
 * posterSrc      optional poster for <video>
 * bgImageSrc     background image shown behind the expanding media
 * title          hero heading — first word goes left, rest goes right
 * scrollToExpand small hint label that moves right as you scroll
 * date           small label that moves left as you scroll
 * textBlend      boolean — apply mix-blend-difference to the title
 * children       content revealed after expansion completes
 */
export default function ScrollExpandMedia({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  breadcrumb,
  date,
  scrollToExpand,
  textBlend = false,
  children,
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent]       = useState(false);
  const [fullyExpanded, setFullyExpanded]   = useState(false);
  const [touchStartY, setTouchStartY]       = useState(0);
  const [isMobile, setIsMobile]             = useState(false);
  const sectionRef = useRef(null);

  /* ── reset on mediaType change ── */
  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setFullyExpanded(false);
  }, [mediaType]);

  /* ── resize → detect mobile ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── wheel / touch / scroll listeners ── */
  useEffect(() => {
    const onWheel = (e) => {
      if (fullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setFullyExpanded(false);
        e.preventDefault();
        return;
      }
      if (!fullyExpanded) {
        e.preventDefault();
        const next = Math.min(Math.max(scrollProgress + e.deltaY * 0.0009, 0), 1);
        setScrollProgress(next);
        if (next >= 1) { setFullyExpanded(true); setShowContent(true); }
        else if (next < 0.75) setShowContent(false);
      }
    };

    const onTouchStart = (e) => setTouchStartY(e.touches[0].clientY);

    const onTouchMove = (e) => {
      if (!touchStartY) return;
      const deltaY = touchStartY - e.touches[0].clientY;
      if (fullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setFullyExpanded(false);
        e.preventDefault();
        return;
      }
      if (!fullyExpanded) {
        e.preventDefault();
        const factor = deltaY < 0 ? 0.008 : 0.005;
        const next = Math.min(Math.max(scrollProgress + deltaY * factor, 0), 1);
        setScrollProgress(next);
        if (next >= 1) { setFullyExpanded(true); setShowContent(true); }
        else if (next < 0.75) setShowContent(false);
        setTouchStartY(e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => setTouchStartY(0);

    const onScroll = () => { if (!fullyExpanded) window.scrollTo(0, 0); };

    window.addEventListener('wheel',      onWheel,      { passive: false });
    window.addEventListener('scroll',     onScroll);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false });
    window.addEventListener('touchend',   onTouchEnd);

    return () => {
      window.removeEventListener('wheel',      onWheel);
      window.removeEventListener('scroll',     onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, [scrollProgress, fullyExpanded, touchStartY]);

  /* ── derived values ── */
  const mw = 300 + scrollProgress * (isMobile ? 650 : 1250);
  const mh = 400 + scrollProgress * (isMobile ? 200 : 400);
  const tx = scrollProgress * (isMobile ? 180 : 150);

  const firstWord = title ? title.split(' ')[0] : '';
  const rest      = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div ref={sectionRef} className={styles.root}>
      <section className={styles.section}>
        <div className={styles.inner}>

          {/* ── Background image (fades out as you scroll) ── */}
          <div
            className={styles.bgWrap}
            style={{ opacity: 1 - scrollProgress }}
          >
            {bgImageSrc && (
              <Image
                src={bgImageSrc}
                alt="Background"
                fill
                className={styles.bgImg}
                priority
              />
            )}
            <div className={styles.bgOverlay} />
          </div>

          {/* ── Expanding media box ── */}
          <div className={styles.mediaOuter}>
            <div
              className={styles.mediaBox}
              style={{
                width:  `${mw}px`,
                height: `${mh}px`,
                maxWidth:  '95vw',
                maxHeight: '85vh',
              }}
            >
              {mediaType === 'video' ? (
                <div className={styles.mediaInner}>
                  <video
                    src={mediaSrc}
                    poster={posterSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className={styles.media}
                  />
                  <div
                    className={styles.mediaDimmer}
                    style={{ opacity: Math.max(0, 0.5 - scrollProgress * 0.3) }}
                  />
                </div>
              ) : (
                <div className={styles.mediaInner}>
                  <Image
                    src={mediaSrc}
                    alt={title || 'Hero media'}
                    fill
                    className={styles.media}
                    priority
                  />
                  <div
                    className={styles.mediaDimmer}
                    style={{ opacity: Math.max(0, 0.7 - scrollProgress * 0.3) }}
                  />
                </div>
              )}

              {/* Labels that slide apart */}
              <div className={styles.labels}>
                {breadcrumb && (
                  <nav className={styles.breadcrumb} aria-label="Breadcrumb" style={{ transform: `translateX(-${tx}vw)` }}>
                    <a href="/">Home</a>
                    <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
                    <span>{breadcrumb}</span>
                  </nav>
                )}
                {date && (
                  <p
                    className={styles.labelText}
                    style={{ transform: `translateX(-${tx}vw)` }}
                  >
                    {date}
                  </p>
                )}
                {scrollToExpand && (
                  <p
                    className={styles.labelText}
                    style={{ transform: `translateX(${tx}vw)` }}
                  >
                    {scrollToExpand}
                  </p>
                )}
              </div>
            </div>

            {/* ── Title words that slide apart ── */}
            <div
              className={`${styles.titleRow} ${textBlend ? styles.blendDiff : ''}`}
            >
              <h1
                className={styles.titleWord}
                style={{ transform: `translateX(-${tx}vw)` }}
              >
                {firstWord}
              </h1>
              <h1
                className={styles.titleWord}
                style={{ transform: `translateX(${tx}vw)` }}
              >
                {rest}
              </h1>
            </div>
          </div>

        </div>
      </section>

      {/* ── Revealed content ── */}
      <div
        className={styles.content}
        style={{ opacity: showContent ? 1 : 0, pointerEvents: showContent ? 'auto' : 'none' }}
      >
        {children}
      </div>
    </div>
  );
}
