import React from 'react';
import styles from './PaymentMethods.module.css';

export default function PaymentMethods() {
  return (
    <div className={styles.container}>
      <p className={styles.title}>Secure Payments via PayNow</p>
      <div className={styles.methodsGrid}>
        
        {/* Visa */}
        <div className={styles.methodCard} title="Visa">
          <svg viewBox="0 0 38 12" xmlns="http://www.w3.org/2000/svg" className={styles.visa}>
            <path d="M14.654 0l-1.018 7.423h1.644l1.016-7.423h-1.642zm8.793 0l-1.077 5.176c-.1.492.213.682.525.682.35 0 .61-.176.732-.437l1.496-5.42h1.72l-2.072 7.422h-1.722l-.125-.63c-.452.482-1.22.753-2.03.753-1.636 0-2.614-1.12-2.22-2.923l1.107-4.623h1.666zm-5.698 0l-1.107 4.623c-.394 1.802.13 2.923 1.767 2.923.81 0 1.63-.27 2.083-.752l.125.63h1.722l2.072-7.423h-1.666l-1.107 4.623c-.395 1.802-.857 2.05-1.503 2.05-.644 0-1.11-.248-.716-2.05l1.107-4.623h-1.777zM2.81 0H.813L0 7.423h1.642L2.5 1.545l2.25 5.878h1.72L3.89 0H2.81z" fill="#1434CB"/>
          </svg>
        </div>

        {/* Mastercard */}
        <div className={styles.methodCard} title="Mastercard">
          <svg viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg" className={styles.mastercard}>
            <circle fill="#EB001B" cx="10" cy="10" r="10" />
            <circle fill="#F79E1B" cx="22" cy="10" r="10" />
            <path fill="#FF5F00" d="M16 18c-2.4 0-4.6-1.1-6-2.8 1.4-1.7 3.6-2.8 6-2.8s4.6 1.1 6 2.8c-1.4 1.7-3.6 2.8-6 2.8z" />
          </svg>
        </div>

        {/* EcoCash */}
        <div className={styles.methodCard} title="EcoCash">
          <div className={styles.ecocashBadge}>
            EcoCash
          </div>
        </div>

        {/* Innbucks */}
        <div className={styles.methodCard} title="Innbucks">
          <div className={styles.innbucksBadge}>
            InnBucks
          </div>
        </div>

      </div>
    </div>
  );
}
