'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CategoryStrip.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function CategoryStrip() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API_URL}/categories`);
        const data = await res.json();
        const valid = data
          .filter((c) => c && c.name && c.name.trim() !== '')
          .slice(0, 6);
        setCategories(valid);
      } catch (err) {
        console.error('CategoryStrip fetch error:', err);
      }
    }
    load();
  }, []);

  if (categories.length === 0) return null;

  return (
    <nav
      className={styles.strip}
      aria-label="Shop by category"
      id="category-strip"
    >
      <ul className={styles.list} role="list">
        {categories.map((cat, idx) => (
          <li key={cat.id || cat.name} className={styles.item}>
            <Link
              href={`/shop?q=${encodeURIComponent(cat.name)}`}
              className={styles.link}
              id={`cat-strip-${cat.id || cat.name.replace(/\s+/g, '-')}`}
            >
              {cat.name}
            </Link>
            {idx < categories.length - 1 && (
              <span className={styles.sep} aria-hidden="true">·</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
