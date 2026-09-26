'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './NotificationBar.module.css';

const MESSAGES = [
  { text: "New spring collection", href: "/shop" },
  { text: "Join waiting list", href: "/waitlist" }
];

export default function NotificationBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.bar}>
      <div className={styles.left}></div>
      <div className={styles.center}>
        <div className={styles.messageWrap}>
          {MESSAGES.map((msg, i) => (
            <Link 
              key={i} 
              href={msg.href}
              className={`${styles.message} ${i === currentIndex ? styles.active : ''}`}
            >
              {msg.text}
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.right}>
        <div 
          className={styles.dropdown}
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className={styles.supportLabel}>
            Support
            <svg 
              width="10" 
              height="6" 
              viewBox="0 0 10 6" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: '6px', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M1 1L5 5L9 1"/>
            </svg>
          </span>
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <Link href="/contact">Contact Us</Link>
              <Link href="/faq">FAQ</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
