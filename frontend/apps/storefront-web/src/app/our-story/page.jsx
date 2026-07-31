'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import ShuffleHero from '@/components/ui/ShuffleGrid/ShuffleGrid';
import styles from './OurStory.module.css';

export default function OurStoryPage() {
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

        {/* Shuffle Hero */}
        <div id="our-story-content" className={styles.heroSection}>
          <ShuffleHero />
        </div>

        {/* Fade strip from dark hero into white content */}
        <div className={styles.heroFade} />

        {/* Content Section with Zig-Zag Layout */}
        <section className={styles.contentSection}>

          {/* Row 1: Who We Are (Part 1) + Image 1 */}
          <div className={styles.editorialRow}>
            <div className={styles.editorialText}>
              <span className={styles.sectionLabel}>01 — Brand Identity</span>
              <h2 className={styles.sectionHeading}>Who We Are</h2>
              <div className={styles.textBlock}>
                <p>
                  RedAvo is more than just a proudly African activewear and athleisure brand. 
                  RedAvo strives to challenge the status quo by incorporating a holistic wellness 
                  lifestyle into the mix. Your mental health is just as important as your physical health. 
                  This mind-and-body focus inspires confidence in yourself from the inside, out.
                </p>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-large-1.PNG" alt="Lookbook 1" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>

          {/* Row 2: Who We Are (Part 2) + Image 2 */}
          <div className={`${styles.editorialRow} ${styles.reverse}`}>
            <div className={styles.editorialText}>
              <div className={styles.textBlock}>
                <p>
                  RedAvo's high-quality activewear apparel blends style, utility, and comfort so that 
                  you not only look good, but also feel good. Our bold range of colours have been 
                  designed to complement every skin tone and to celebrate self-expression. We want you 
                  to feel comfortable and confident, whether you're working up a sweat, shopping for 
                  groceries, or picking the kids up from school.
                </p>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-small-1.PNG" alt="Lookbook 2" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>



          {/* Row 4: Brand Promise & Positioning + Image 4 */}
          <div className={styles.editorialRow}>
            <div className={styles.editorialText}>
              <span className={styles.sectionLabel}>02 — Brand Vision</span>
              <h2 className={styles.sectionHeading}>Our Vision & Promise</h2>
              <div className={styles.textBlock}>
                <h3 className={styles.accentHeading}>Brand Promise</h3>
                <p>
                  We promise to advocate for women's holistic well-being and deliver high quality activewear.
                </p>
                <h3 className={styles.accentHeading} style={{ marginTop: '24px' }}>Brand Positioning</h3>
                <p>
                  RedAvo is a proudly African activewear and athleisure brand that challenges today's fitness culture. 
                  We inspire women to place as much emphasis on mental well-being, strength and fitness as they do on physical prowess.
                </p>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-large-2.PNG" alt="Lookbook 4" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>

          {/* Row 5: Brand Pillars + Image 5 */}
          <div className={`${styles.editorialRow} ${styles.reverse}`}>
            <div className={styles.editorialText}>
              <h3 className={styles.accentHeading}>Brand Pillars</h3>
              <div className={styles.cardGrid} style={{ marginTop: 0, gap: '24px', gridTemplateColumns: '1fr' }}>
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>Calm</h3>
                  <p className={styles.cardText}>
                    <strong>Quiet the mind, and the soul will speak.</strong><br/><br/>
                    RedAvo believes that looking after your mind is just as important as looking after your body.
                  </p>
                </div>
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>Capable</h3>
                  <p className={styles.cardText}>
                    <strong>Strive for progress, not perfection.</strong><br/><br/>
                    RedAvo challenges today's fitness culture by showing that fitness isn't one body type, exercise routine, or latest diet fad.
                  </p>
                </div>
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>Confident</h3>
                  <p className={styles.cardText}>
                    <strong>You are your priority.</strong><br/><br/>
                    RedAvo blends comfort, style and practicality so that you feel inspired to look after both your mind and body.
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-small-3.PNG" alt="Lookbook 5" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>

          {/* Row 6: Brand Vision List + Image 6 */}
          <div className={styles.editorialRow}>
            <div className={styles.editorialText}>
              <h3 className={styles.accentHeading}>Brand Vision</h3>
              <div className={styles.textBlock}>
                <ul className={styles.ulList}>
                  <li>To be the most authentic, admired and sought-after African activewear and athleisure brand.</li>
                  <li>To have the entire RedAvo supply chain based in Africa, to support local employment and empowerment.</li>
                  <li>To create a RedAvo community that equips individuals with tools required for mental, physical, and spiritual wellbeing.</li>
                </ul>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-small-4.PNG" alt="Lookbook 6" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>

        </section>

      </main>
      <Footer />
    </>
  );
}
