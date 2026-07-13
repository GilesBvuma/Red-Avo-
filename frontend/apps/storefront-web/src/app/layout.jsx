import './globals.css';

export const metadata = {
  title: 'Red Avo — Authentic Sportswear',
  description:
    'Shop Red Avo activewear: sports bras, leggings, jackets and accessories. Bold design. Fearless performance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
