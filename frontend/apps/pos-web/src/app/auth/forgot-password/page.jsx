'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword, resetPassword } from '@red-avo/api-client';
import styles from '../auth.module.css';

export default function ForgotPassword() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await forgotPassword(email);
      setSuccess('OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await resetPassword(email, otp, newPassword);
      setSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/auth/role-select');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Password Reset</h1>
          <p className={styles.subtitle}>
            {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}
          </p>
        </div>

        {step === 1 ? (
          <form className={styles.form} onSubmit={handleRequestOtp}>
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
            
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/auth/role-select" className={styles.link}>
                ← Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleResetPassword}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div style={{ color: '#48bb78', textAlign: 'center', marginBottom: '1rem' }}>{success}</div>}
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>OTP (6 digits)</label>
              <input
                type="text"
                className={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
