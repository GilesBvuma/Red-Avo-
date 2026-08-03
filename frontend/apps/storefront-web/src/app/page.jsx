'use client';

import Nav from '@/components/Nav/Nav';
import Hero from '@/components/Hero/Hero';
import Ticker from '@/components/Ticker/Ticker';
import BrandStatement from '@/components/BrandStatement/BrandStatement';
import VideoStrip from '@/components/VideoStrip/VideoStrip';
import Collections from '@/components/Collections/Collections';
import Community from '@/components/Community/Community';
import PopularPicks from '@/components/PopularPicks/PopularPicks';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ticker text="ACTIVEWEAR THAT MOVES WITH YOU · EMPOWERING EVERY MOTION" />
        <VideoStrip />
        <BrandStatement />
        <Collections />
        <PopularPicks />
        <Community />
      </main>
      <Footer />
    </>
  );
}
