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

/* ── Metadata ── */
export const metadata = {
  title:       'RedAvo Activewear — Authentic. Fearless | Premium Women\'s Activewear',
  description: 'RedAvo Activewear is premium women\'s activewear. Authentic in design. Fearless in motion. Shop leggings, sports bras, jackets and matching sets.',
  keywords:    'womens activewear, sportswear, leggings, sports bras, RedAvo Activewear, authentic, fearless',
  openGraph: {
    title:       'RedAvo Activewear — Authentic. Fearless',
    description: 'Premium women\'s activewear. Built for her motion.',
    type:        'website',
    locale:      'en_ZA',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${playfair.variable}`}
    >
      <body suppressHydrationWarning={true}>
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
