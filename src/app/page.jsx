import Nav            from '@/components/Nav/Nav';
import Hero           from '@/components/Hero/Hero';
import Ticker         from '@/components/Ticker/Ticker';
import Collections    from '@/components/Collections/Collections';
import BrandStatement from '@/components/BrandStatement/BrandStatement';
import PopularPicks   from '@/components/PopularPicks/PopularPicks';
import VideoStrip     from '@/components/VideoStrip/VideoStrip';
import About          from '@/components/About/About';
import Lookbook       from '@/components/Lookbook/Lookbook';
import Contact        from '@/components/Contact/Contact';
import Footer         from '@/components/Footer/Footer';
import { TICKER_1, TICKER_2 } from '@/constants/brand';

export default function HomePage() {
  return (
    <main>
      {/* S1 — Navigation */}
      <Nav />

      {/* S2 — Hero */}
      <Hero />

      {/* S3 — Marquee Ticker 1 — Navy, left-to-right */}
      <Ticker
        text={TICKER_1}
        direction="ltr"
        bg="var(--navy)"
        color="#fff"
        accentColor="var(--pink)"
      />

      {/* S4 — Featured Collections */}
      <Collections />

      {/* S5 — Brand Statement */}
      <BrandStatement />

      {/* S6 — Popular Picks */}
      <PopularPicks />

      {/* S7 — Parallax Video Strip */}
      <VideoStrip />

      {/* S8 — About / Brand Story */}
      <About />

      {/* S9 — Marquee Ticker 2 — Pink, right-to-left */}
      <Ticker
        text={TICKER_2}
        direction="rtl"
        bg="var(--pink)"
        color="#fff"
        accentColor="var(--navy)"
      />

      {/* S10 — Lookbook / Instagram Grid */}
      <Lookbook />

      {/* S11 — Contact / Newsletter */}
      <Contact />

      {/* S12 — Footer */}
      <Footer />
    </main>
  );
}
