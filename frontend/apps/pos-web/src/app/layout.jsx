import { Bebas_Neue, Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

/* ── Fonts ── */
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
  weight:   ['300', '400', '500', '600', '700', '800', '900'],
});

const bebasNeue = Bebas_Neue({
  subsets:  ['latin'],
  variable: '--font-bebas',
  display:  'swap',
  weight:   ['400'],
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
  title:       'Red Avo — Authentic · Fearless | Premium Women\'s Activewear',
  description: 'Red Avo is premium women\'s activewear. Authentic in design. Fearless in motion. Shop leggings, sports bras, jackets and matching sets.',
  keywords:    'womens activewear, sportswear, leggings, sports bras, Red Avo, authentic, fearless',
  openGraph: {
    title:       'Red Avo — Authentic · Fearless',
    description: 'Premium women\'s activewear. Built for her motion.',
    type:        'website',
    locale:      'en_ZA',
  },
};

import { AuthProvider } from './AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bebasNeue.variable} ${playfair.variable}`}
    >
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
