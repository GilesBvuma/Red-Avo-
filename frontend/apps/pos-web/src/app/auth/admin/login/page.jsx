'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../AuthProvider';
import styles from '../../auth.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // login handles routing
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Login</h1>
          <p className={styles.subtitle}>Welcome back, administrator</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <Link href="/auth/role-select" className={styles.link}>
              ← Back to role selection
            </Link>
            <Link href="/auth/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
            <Link href="/auth/admin/register" className={styles.link}>
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
