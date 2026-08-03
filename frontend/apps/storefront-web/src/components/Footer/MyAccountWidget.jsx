'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import styles from './MyAccountWidget.module.css';

export default function MyAccountWidget({ theme = 'dark', hideTitle = false }) {
  const [step, setStep] = useState('IDLE'); // IDLE | OTP | REGISTER | AUTHENTICATED
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // Registration fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);

  // Check session on mount
  useEffect(() => {
    const stored = localStorage.getItem('redavo_customer_session');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
          setSession(data);
          setStep('AUTHENTICATED');
        } else {
          localStorage.removeItem('redavo_customer_session');
        }
      } catch (err) {
        localStorage.removeItem('redavo_customer_session');
      }
    }
  }, []);

  const saveSession = (customer) => {
    // 24 hours expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const sessionData = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      expiresAt: expiresAt.toISOString(),
    };
    
    localStorage.setItem('redavo_customer_session', JSON.stringify(sessionData));
    setSession(sessionData);
    setStep('AUTHENTICATED');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep('OTP');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      if (data.exists) {
        saveSession(data.customer);
      } else {
        setStep('REGISTER');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !phoneNumber || !address) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, phoneNumber, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      saveSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('redavo_customer_session');
    setSession(null);
    setEmail('');
    setOtp('');
    setStep('IDLE');
  };

  return (
    <div className={`${styles.widget} ${theme === 'light' ? styles.light : ''}`}>
      {!hideTitle && <p className={styles.colLabel}>My Account</p>}
      
      {error && <div className={styles.error}>{error}</div>}

      {step === 'IDLE' && (
        <form onSubmit={handleSendOtp} className={styles.formGroup}>
          {!hideTitle && <p className={styles.helpText}>Enter your email to sign in or create an account.</p>}
          <div className={styles.inputWrap}>
            <input
              type="email"
              className={styles.input}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className={styles.formGroup}>
          <p className={styles.helpText}>Enter the 6-digit code sent to {email}.</p>
          <div className={styles.inputWrap}>
            <input
              type="text"
              className={styles.input}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              disabled={loading}
              required
            />
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          <button type="button" className={styles.textBtn} onClick={() => setStep('IDLE')} disabled={loading}>
            Change Email
          </button>
        </form>
      )}

      {step === 'REGISTER' && (
        <form onSubmit={handleRegister} className={styles.formGroup}>
          <p className={styles.helpText}>Complete your profile to finish setting up your account.</p>
          <input
            type="text"
            className={styles.fullInput}
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            required
          />
          <input
            type="text"
            className={styles.fullInput}
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            required
          />
          <input
            type="tel"
            className={styles.fullInput}
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
            required
          />
          <input
            type="text"
            className={styles.fullInput}
            placeholder="Shipping Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            required
          />
          <div className={styles.actions}>
            <button type="submit" className={styles.fullBtn} disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {step === 'AUTHENTICATED' && session && (
        <div className={styles.authenticated}>
          <p className={styles.welcomeText}>Welcome back, {session.firstName}!</p>
          <p className={styles.emailText}>{session.email}</p>
          <div className={styles.authLinks}>
            <a href="#" className={styles.authLink}>Order History</a>
            <a href="#" className={styles.authLink}>Addresses</a>
          </div>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
