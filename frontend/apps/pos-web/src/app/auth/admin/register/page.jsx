'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerAdmin } from '@red-avo/api-client';
import styles from '../../auth.module.css';

export default function AdminRegister() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    superPassword: '' // Must be entered manually — must match the SUPER_PASSWORD set in the backend .env
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    setError('');

    try {
      await registerAdmin(formData);
      router.push('/auth/admin/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Registration</h1>
          <p className={styles.subtitle}>Create your administrator account</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              name="fullName"
              className={styles.input}
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              className={styles.input}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              className={styles.input}
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              className={styles.input}
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className={styles.input}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Super Password</label>
            <input
              type="password"
              name="superPassword"
              className={styles.input}
              value={formData.superPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link href="/auth/admin/login" className={styles.link}>
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
