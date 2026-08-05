'use client';

import Image from 'next/image';
import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import ShuffleHero from '@/components/ui/ShuffleGrid/ShuffleGrid';
import StickyNote from '@/components/StickyNote/StickyNote';
import styles from './OurStory.module.css';

export default function OurStoryPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        {/* Watermarks */}
        <Image
          src="/images/logo3 - footer.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark1}`}
          unoptimized={true}
        />
        <Image
          src="/images/logo3 - footer.png"
          alt=""
          width={800}
          height={800}
          className={`${styles.watermark} ${styles.watermark2}`}
          unoptimized={true}
        />
        <Image
          src="/images/logo3 - footer.png"
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

              <h2 className={styles.sectionHeading}>Who We Are</h2>
              <div className={styles.textBlock}>
                <p>
                  RedAvo Activewear is a proudly Zimbabwean holistic wellness lifestyle brand. We advocate against a one size-fits-all wellness approach. We inspire women to balance and nourish mind, body and soul. RedAvo Activewear's purpose is creating well-crafted functional active & athleisure apparel, inspired by a synchronization of movement and the body.
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
                  Your mental health is just as important, as your physical health. This mind-and-body focus inspires confidence in yourself from the inside-out. RedAvo's high-quality activewear apparel blends style, utility, and comfort so that you not only look good, but also feel good. We want you to feel comfortable and confident, whether you're working up a sweat, running errands, on a coffee date, picking the kids up from school or just chilling at home.
                </p>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-small-1.PNG" alt="Lookbook 2" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>



          {/* Row 3: Our Story (Part 1) + Image 3 */}
          <div className={styles.editorialRow}>
            <div className={styles.editorialText}>

              <h2 className={styles.sectionHeading}>Our Story</h2>
              <div className={styles.textBlock}>
                <p>
                  The brand was born out of a deeply painful personal journey of healing and rebuilding. Physical movement benefits for mental health became a turning point in this journey. The connection between mental wellbeing, nutrition and physical health became the foundation for what RedAvo Activewear would become.
                </p>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-large-2.PNG" alt="Lookbook 3" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>

          {/* Row 4: Our Story (Part 2) + Image 4 */}
          <div className={`${styles.editorialRow} ${styles.reverse}`}>
            <div className={styles.editorialText}>
              <div className={styles.textBlock}>
                <p>
                  RedAvo Activewear stands for holistic wellness, balance of mind, body and soul. Our mission is to empower women and at the core to create opportunities for women and children who come from abusive and traumatic backgrounds to build financial independence and new positive chapters.
                </p>
              </div>
            </div>
            <div className={styles.editorialImageWrap}>
              <Image src="/images/lookbook-small-3.PNG" alt="Lookbook 4" fill style={{ objectFit: 'cover' }} unoptimized={true} />
            </div>
          </div>

        </section>

        {/* â”€â”€ Sticky Note Section â”€â”€ */}
        <section style={{
          background: '#5E080C',
          padding: '80px 24px',
        }}>
          <StickyNote
            heading="To the woman who's been meaning to start,"
            paragraphs={[
              "This is your reminder: you don't have to feel ready to show up.",
              "You just have to show up.",
              "Show up on the days you feel strong, and especially on the days you don't.",
              "Show up when your mind is loud. Show up when your confidence is shaky. Show up when life is heavy and you're tempted to disappear into old habits, old fears, and old stories.",
              "RedAvo was built for this exact moment, the moment you decide to pour into yourself again.",
            ]}
            signature="Love from Idah x"
          />
        </section>

      </main>
      <Footer />
    </>
  );
}
