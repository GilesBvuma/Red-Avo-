'use client';

import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import CollectionHero from '@/components/CollectionPage/CollectionHero';
import Ticker from '@/components/Ticker/Ticker';
import CollectionBanners from '@/components/CollectionPage/CollectionBanners';
import CollectionFeatures from '@/components/CollectionPage/CollectionFeatures';
import CommunitySection from '@/components/CollectionPage/CommunitySection';

export default function CollectionsPage() {
  return (
    <>
      <Nav />
      <main>
        <CollectionHero />
        <Ticker 
          text="EMPOWERING EVERY MOTION · ACTIVEWEAR THAT MOVES WITH YOU" 
          slant="ccw"
          style={{ marginTop: '-14px', marginBottom: '-14px', position: 'relative', zIndex: 10 }}
        />
        <CollectionBanners />
        <CollectionFeatures />
        <CommunitySection />
      </main>
      <Footer />
    </>
  );
}
