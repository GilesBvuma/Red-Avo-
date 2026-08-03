'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import Placeholder from '@/components/Placeholder/Placeholder';
import { SOCIALS } from '@/constants/brand';
import styles from './Contact.module.css';

export default function Contact() {
  const sectionRef = useRef(null);
  const [form, setForm]       = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);


  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      // GSAP button feedback
      gsap.fromTo('#contact-submit-btn',
        { scale: 0.95 },
        { scale: 1, duration: 0.3, ease: 'back.out(2)' }
      );
      setSubmitted(true);
      
      setTimeout(() => {
        setSubmitted(false);
        setForm({ name: '', email: '', message: '' });
      }, 3000);
      
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" ref={sectionRef} className={styles.section} aria-labelledby="contact-heading">
      {/* ── Left — Navy ── */}
      <div className={`${styles.left} contact-left-panel`}>
        <h2 id="contact-heading" className={styles.leftHeading}>GET IN TOUCH</h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <input
            className={styles.input}
            type="text"
            name="name"
            id="contact-name"
            placeholder="Your Name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className={styles.input}
            type="email"
            name="email"
            id="contact-email"
            placeholder="Email Address"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            name="message"
            id="contact-message"
            placeholder="Your message…"
            value={form.message}
            onChange={handleChange}
          />
          {errorMsg && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', margin: '0' }}>{errorMsg}</p>}
          <button
            id="contact-submit-btn"
            type="submit"
            disabled={submitting}
            className={`${styles.submitBtn} ${submitted ? styles.submitted : ''}`}
          >
            {submitting ? 'SENDING...' : submitted ? '✓ MESSAGE SENT' : 'SUBMIT'}
          </button>
        </form>
      </div>

      {/* ── Right — Blush ── */}
      <div className={`${styles.right} contact-right-panel`}>
        <div className={styles.logoWrap}>
          <Placeholder label="/images/logo2.png" subtitle="RedAvo Activewear Logo" className={styles.logo} />
        </div>

        <p className={styles.rightBig}>
          THANK YOU FOR<br />MOVING<br />WITH US.
        </p>

        <div className={styles.socials} role="list" aria-label="Social links">
          {SOCIALS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              id={`social-${s.id}`}
              className={styles.socialIcon}
              aria-label={s.label}
              role="listitem"
            >
              <SocialSVG id={s.id} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialSVG({ id }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (id) {
    case 'instagram':
      return <svg {...props}><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" /></svg>;
    case 'tiktok':
      return <svg {...props} fill="currentColor" stroke="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.72a8.18 8.18 0 004.79 1.53V6.82a4.87 4.87 0 01-1.02-.13z" /></svg>;
    case 'facebook':
      return <svg {...props}><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
    case 'pinterest':
      return <svg {...props}><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.22-5.15 1.22-5.15s-.31-.63-.31-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.58 2.26-.87 3.51-.25 1.05.52 1.9 1.55 1.9 1.86 0 3.11-2.4 3.11-5.24 0-2.16-1.47-3.77-4.12-3.77-3 0-4.88 2.24-4.88 4.74 0 .86.25 1.47.64 1.94.18.21.2.3.14.54-.05.18-.16.61-.2.78-.07.25-.27.34-.5.25-1.39-.57-2.04-2.1-2.04-3.81 0-2.84 2.4-6.27 7.17-6.27 3.85 0 6.41 2.8 6.41 5.8 0 3.97-2.2 6.94-5.43 6.94-1.09 0-2.12-.59-2.47-1.25l-.67 2.61c-.24.93-.7 1.86-1.13 2.59.85.26 1.75.4 2.68.4 5.52 0 10-4.48 10-10S17.52 2 12 2z" /></svg>;
    default: return null;
  }
}
