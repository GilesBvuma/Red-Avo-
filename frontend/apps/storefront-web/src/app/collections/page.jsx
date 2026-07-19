'use client';

import Nav from '@/components/Nav/Nav';
import Footer from '@/components/Footer/Footer';
import CollectionHero from '@/components/CollectionPage/CollectionHero';
import CollectionBanners from '@/components/CollectionPage/CollectionBanners';
import CollectionFeatures from '@/components/CollectionPage/CollectionFeatures';
import CommunitySection from '@/components/CollectionPage/CommunitySection';

export default function CollectionsPage() {
  return (
    <>
      <Nav />
      <main>
        <CollectionHero />
        <CollectionBanners />
        <CollectionFeatures />
        <CommunitySection />
      </main>
      <Footer />
    </>
  );
}
