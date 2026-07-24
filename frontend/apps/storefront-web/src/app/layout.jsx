import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';

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
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
