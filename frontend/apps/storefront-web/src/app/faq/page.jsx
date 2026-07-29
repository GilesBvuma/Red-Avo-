'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import styles from '../info.module.css';

export default function FAQPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        {/* Watermarks */}
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark1}`}
          unoptimized={true}
        />
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark2}`}
          unoptimized={true}
        />
        <Image
          src="/images/emoji.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark3}`}
          unoptimized={true}
        />
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span className={styles.breadcrumbSep} aria-hidden="true">›</span>
            <span>FAQ</span>
          </nav>
          <h1 className={styles.heading}>Frequently Asked Questions</h1>
          <div className={styles.card}>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>1. How long does a delivery on my order take?</h2>
              <p className={styles.text}>You should have your order within 24hrs if delivery address is in Harare. Out of Harare delivery address, expect delivery 24hrs to 72hrs after order confirmation. Kindly note, orders that are made after 1pm local Harare time will only be processed the following morning or following business day.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>2. Do you ship internationally? Where do you ship to?</h2>
              <p className={styles.text}>Not at the moment, we are currently only shipping within Zimbabwe.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>3. How can I get Free Shipping?</h2>
              <p className={styles.text}>You’re in luck! We offer free shipping on your first order above $100.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>4. Can I track my order online?</h2>
              <p className={styles.text}>Currently you cannot. We are still working with our courier-forwarding partners to include this feature.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>5. How do I figure out my size?</h2>
              <p className={styles.text}>We recommend that you take your measurements and then consult our <a href="/size-chart" className={styles.link}>size guide here</a> to ensure that you get a good fit. If you find that the garment does not fit when you get it, please arrange a return via this form.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>6. What payment options are available for my order?</h2>
              <p className={styles.text}>You can pay for your order in cash, local bank cards or via mobile money platforms (Ecocash & Innbucks).</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>7. Can I exchange or return a product if it does not fit?</h2>
              <p className={styles.text}>Yes, please have a look at our <a href="/returns" className={styles.link}>returns policy here</a>.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>8. Is there a local pick-up option available for online orders?</h2>
              <p className={styles.text}>Yes, at our store at Borrowdale Racecourse. <a href="https://maps.google.com/?q=Borrowdale+Racecourse+Harare" target="_blank" rel="noopener noreferrer" className={styles.link}>Click here</a> for Google Maps Location.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>9. Can I change my shipping address?</h2>
              <p className={styles.text}>Unfortunately, you are unable to change your shipping address once you have placed your order. Please ensure you input the correct address before placing your order. If you have any issues, please <a href="/contact" className={styles.link}>send us a message here</a>.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>10. Does RedAvo have a physical store location?</h2>
              <p className={styles.text}>Yes, at Borrowdale Racecourse Harare. <a href="https://maps.google.com/?q=Borrowdale+Racecourse+Harare" target="_blank" rel="noopener noreferrer" className={styles.link}>Click here</a> for Google Maps Location.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>11. Is Vat included in the cost?</h2>
              <p className={styles.text}>Yes, VAT is included in the price.</p>
            </div>
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>12. Can I cancel my order?</h2>
              <p className={styles.text}>Yes, please <a href="/contact" className={styles.link}>send us a message</a> via this form and we can discuss the next steps.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
