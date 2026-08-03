'use client';

import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from '../info.module.css';

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Privacy Policy & Terms & Conditions</h1>
          <div className={styles.card}>
            <div className={styles.section}>
              <p className={styles.text}>Our website is <a href="https://www.redavowear.com" className={styles.link} style={{ textDecoration: 'underline' }}>https://www.redavowear.com</a></p>
            </div>
            
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>Use of website</h2>
              <p className={styles.text} style={{ marginBottom: '1rem' }}>When you visit the website as a customer, with or without an account (visitor) and leave comments on the website we collect the data shown in the comments form and also the visitor’s IP address and browser user agent string to help spam detection.</p>
              <p className={styles.text} style={{ marginBottom: '1rem' }}>After approval of your comment, your profile picture is visible to the public in the context of your comment.</p>
              <p className={styles.text} style={{ marginBottom: '1rem' }}>By accessing RedAvo Activewear website, contacting us, details registry or order placement with us, you will be deemed to have read, understood and agreed to these Terms & Conditions. The email address you provide will be used as the mode of communication with you. All actions under your username and password are your responsibility and RedAvo Activewear cannot be held responsible for any misuse. RedAvo Activewear reserves the right to terminate your account and access to the website, without notice, if you are in breach of any of the terms & conditions.</p>
              <p className={styles.text} style={{ marginBottom: '1rem' }}>Availability of items ordered may be misrepresented on the website. If this occurs we will contact you via the email you provided to inform you. We endeavour to deliver products as stated in our delivery policy, failure which we will inform you of the reason for delay and propose new delivery date.</p>
              <p className={styles.text} style={{ marginBottom: '1rem' }}>Codes, promotions, gift cards, etc are only redeemable on the Redavo Activewear website and physical store as their terms state.</p>
              <p className={styles.text}>The terms & conditions may change from time to time without notice to you. All changes will take effect immediately on the live website. You shall be deemed to have accepted the said changes, shown by the continued use of the website.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
