'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import ScrollExpandMedia from '@/components/ui/ScrollExpandMedia/ScrollExpandMedia';
import styles from './ContactPage.module.css';

// SVG Icons
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
);
const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
);

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        {/* Watermarks */}
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark1}`}
          unoptimized={true}
        />
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark2}`}
          unoptimized={true}
        />

        {/* Scroll-Expansion Hero */}
        <ScrollExpandMedia
          mediaType="video"
          mediaSrc="/videos/Contact video.mp4"
          posterSrc="/images/Contact-image.png"
          bgImageSrc="/images/Contact-image.png"
          title="Contact Us"
          breadcrumb="Contact Us"
          scrollToExpand="Scroll to expand"
          textBlend
        >
          {/* Contact content revealed after the hero expands */}
          <section className={styles.contentSection}>
            <div className={styles.grid}>
              {/* Left Column — Info & Socials */}
              <div className={styles.infoCol}>
                <div className={styles.logoWrap}>
                  <Image
                    src="/images/logo.png"
                    alt="RedAvo Logo"
                    fill
                    style={{ objectFit: 'contain', objectPosition: 'left' }}
                  />
                </div>
                <p className={styles.infoText}>
                  We'd love to hear from you. Reach out through any of our channels below.
                </p>

                <div className={styles.socialGrid}>
                  <a href="mailto:sales@redavowear.com" className={styles.socialItem} aria-label="Email">
                    <MailIcon />
                    <span>sales@redavowear.com</span>
                  </a>
                  <a href="tel:+263717709520" className={styles.socialItem} aria-label="Phone/WhatsApp">
                    <WhatsAppIcon />
                    <span>+263 717 709 520</span>
                  </a>
                  <a href="https://www.instagram.com/redavo.activewear?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className={styles.socialItem} aria-label="Instagram">
                    <InstagramIcon />
                    <span>Instagram</span>
                  </a>
                  <a href="https://www.facebook.com/redavo.activewear" target="_blank" rel="noopener noreferrer" className={styles.socialItem} aria-label="Facebook">
                    <FacebookIcon />
                    <span>Facebook</span>
                  </a>
                  <a href="https://www.tiktok.com/@redavoactivewear" target="_blank" rel="noopener noreferrer" className={styles.socialItem} aria-label="TikTok">
                    <TikTokIcon />
                    <span>TikTok</span>
                  </a>
                </div>
              </div>

              {/* Right Column — Form */}
              <div className={styles.formCol}>
                <h2 className={styles.formTitle}>Get in Touch</h2>
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" placeholder="Your name" required />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" placeholder="you@example.com" required />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="subject">Subject</label>
                    <input type="text" id="subject" placeholder="How can we help?" required />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="message">Message</label>
                    <textarea id="message" rows="5" placeholder="Your message..." required></textarea>
                  </div>

                  <button type="submit" className={styles.submitBtn}>
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </section>
        </ScrollExpandMedia>
      </main>
      <Footer />
    </>
  );
}
