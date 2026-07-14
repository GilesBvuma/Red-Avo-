'use client';

import Nav from '@/components/Nav/Nav';
import Hero from '@/components/Hero/Hero';
import Ticker from '@/components/Ticker/Ticker';
import BrandStatement from '@/components/BrandStatement/BrandStatement';
import VideoStrip from '@/components/VideoStrip/VideoStrip';
import Collections from '@/components/Collections/Collections';
import Lookbook from '@/components/Lookbook/Lookbook';
import PopularPicks from '@/components/PopularPicks/PopularPicks';
import About from '@/components/About/About';
import Contact from '@/components/Contact/Contact';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ticker text="ACTIVEWEAR THAT MOVES WITH YOU · EMPOWERING EVERY MOTION" />
        <BrandStatement />
        <VideoStrip />
        <Collections />
        <Lookbook />
        <PopularPicks />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
