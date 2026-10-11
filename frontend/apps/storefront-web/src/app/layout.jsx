import { Montserrat, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import UtmCapture from '@/components/UtmCapture/UtmCapture';
import AbandonedCartMonitor from '@/components/AbandonedCartMonitor/AbandonedCartMonitor';

/* ── Fonts ── */
const montserrat = Montserrat({
  subsets:  ['latin'],
  variable: '--font-montserrat',
  display:  'swap',
  weight:   ['300', '400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  display:  'swap',
  style:    ['normal', 'italic'],
  weight:   ['700'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redavowear.com';

/* ── Metadata ── */
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RedAvo Activewear — Authentic. Fearless | Women\'s Activewear Zimbabwe',
    template: '%s | RedAvo Activewear',
  },
  description: 'Premium women\'s activewear in Zimbabwe. Shop high-waist squat-proof gym leggings, high-support sports bras, matching workout sets & jackets. Fast nationwide delivery.',
  keywords: 'womens activewear zimbabwe, gym wear zimbabwe, activewear zimbabwe, gym leggings, high waist leggings, sports bras, matching gym sets, workout clothes, RedAvo Activewear',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'RedAvo Activewear — Authentic. Fearless | Zimbabwe',
    description: 'Premium women\'s activewear built for movement. Shop gym leggings, sports bras, and workout sets with delivery across Zimbabwe.',
    url: SITE_URL,
    siteName: 'RedAvo Activewear',
    type: 'website',
    locale: 'en_ZW',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RedAvo Activewear — Authentic. Fearless',
    description: 'Premium women\'s activewear in Zimbabwe. Engineered for strength, movement, and confidence.',
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'RedAvo Activewear',
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo3%20-%20footer.png`,
      description: 'Premium women\'s activewear brand in Zimbabwe designed for strength, movement, and confidence.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'RedAvo Activewear',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/shop?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${playfair.variable}`}
    >
      <body suppressHydrationWarning={true}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
                <Script
                  id="meta-pixel"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                    __html: `
                      !function(f,b,e,v,n,t,s)
                      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                      n.queue=[];t=b.createElement(e);t.async=!0;
                      t.src=v;s=b.getElementsByTagName(e)[0];
                      s.parentNode.insertBefore(t,s)}(window, document,'script',
                      'https://connect.facebook.net/en_US/fbevents.js');
                      fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                      fbq('track', 'PageView');
                    `,
                  }}
                />
              )}
              <UtmCapture />
              <AbandonedCartMonitor />
              {children}
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
