'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function RoleSelect() {
  const router = useRouter();
  const [showSuperPassword, setShowSuperPassword] = useState(false);
  const [superPassword, setSuperPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminClick = () => {
    setShowSuperPassword(true);
  };

  const handleEmployeeClick = () => {
    router.push('/auth/employee/login');
  };

  const handleSuperPasswordSubmit = (e) => {
    e.preventDefault();
    // For now it's hardcoded on frontend just to route, actual validation is on backend during register
    if (superPassword === '12345678') {
      // Navigate to admin login (they can choose to register from there)
      router.push('/auth/admin/login');
    } else {
      setError('Invalid Super Password');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Red Avo</h1>
          <p className={styles.subtitle}>Please select your role to continue</p>
        </div>

        {!showSuperPassword ? (
          <div className={styles.roleButtons}>
            <button className={styles.roleButton} onClick={handleAdminClick}>
              👑 Administrator
            </button>
            <button className={styles.roleButton} onClick={handleEmployeeClick}>
              👤 Employee
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSuperPasswordSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Super Password</label>
              <input
                type="password"
                className={styles.input}
                value={superPassword}
                onChange={(e) => setSuperPassword(e.target.value)}
                placeholder="Enter super password to access Admin"
                autoFocus
              />
            </div>
            
            <button type="submit" className={styles.button}>
              Verify
            </button>
            
            <button 
              type="button" 
              className={styles.link}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '1rem' }}
              onClick={() => setShowSuperPassword(false)}
            >
              ← Back to roles
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
