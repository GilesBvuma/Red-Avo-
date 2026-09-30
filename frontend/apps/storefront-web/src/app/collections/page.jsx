'use client';

import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import CollectionHero from '@/components/CollectionPage/CollectionHero';
import Ticker from '@/components/Ticker/Ticker';
import CollectionsGrid from '@/components/CollectionsGrid/CollectionsGrid';

export default function CollectionsPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Existing hero banner — unchanged */}
        <CollectionHero />

        {/* Marquee ticker strip */}
        <Ticker
          text="EMPOWERING EVERY MOTION · ACTIVEWEAR THAT MOVES WITH YOU"
          slant="ccw"
          style={{
            marginTop: '-14px',
            marginBottom: '-14px',
            position: 'relative',
            zIndex: 10,
          }}
        />

        {/* Dynamic curated collections grid */}
        <CollectionsGrid />
      </main>
      <Footer />
    </>
  );
}
