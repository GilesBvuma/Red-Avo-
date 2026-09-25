'use client';

import Nav from '@/components/Nav/Nav';
import Hero from '@/components/Hero/Hero';
import Ticker from '@/components/Ticker/Ticker';
import VideoStrip from '@/components/VideoStrip/VideoStrip';
import NewArrivals from '@/components/NewArrivals/NewArrivals';
import Community from '@/components/Community/Community';
import PopularPicks from '@/components/PopularPicks/PopularPicks';
import Footer from '@/components/Footer/Footer';
import styles from './home.module.css';

export default function Home() {
  return (
    <div className={styles.homeWrapper}>
      {/* Watermark layer — fixed behind all content */}
      <div className={styles.watermarkLayer} aria-hidden="true">
        <img src="/images/logo3 - footer.png" alt="" className={`${styles.wm} ${styles.wm1}`} />
        <img src="/images/logo3 - footer.png" alt="" className={`${styles.wm} ${styles.wm2}`} />
        <img src="/images/logo3 - footer.png" alt="" className={`${styles.wm} ${styles.wm3}`} />
        <img src="/images/logo3 - footer.png" alt="" className={`${styles.wm} ${styles.wm4}`} />
        <img src="/images/logo3 - footer.png" alt="" className={`${styles.wm} ${styles.wm5}`} />
      </div>

      <Nav />
      <main>
        <Hero />
        <Ticker
          text="ACTIVEWEAR THAT MOVES WITH YOU · EMPOWERING EVERY MOTION"
          bg="transparent"
          color="var(--navy)"
          accentColor="var(--red)"
        />
        <NewArrivals />
        <VideoStrip />
        <PopularPicks />
        <Community />
      </main>
      <Footer />
    </div>
  );
}
