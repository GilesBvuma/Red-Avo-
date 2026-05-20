// ─── Brand Color Tokens ───────────────────────────────────────────
export const COLORS = {
  red:   '#C0392B',
  green: '#5D8A3C',
  cream: '#FAFAF5',
  pink:  '#E91E8C',
  navy:  '#1A2B4A',
  blush: '#FDE8EF',
  sage:  '#EAF2E3',
  white: '#FFFFFF',
};

// ─── Navigation Links ─────────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'Home',        href: '#hero' },
  { label: 'Shop',        href: '#collections' },
  { label: 'About',       href: '#about' },
  { label: 'Collections', href: '#popular' },
  { label: 'Contact',     href: '#contact' },
];

// ─── Collection Categories ────────────────────────────────────────
export const CATEGORIES = [
  { id: 'leggings',  label: 'LEGGINGS',    placeholder: '/images/category-leggings.jpg', subtitle: 'Leggings' },
  { id: 'bras',      label: 'SPORTS BRAS', placeholder: '/images/category-bras.jpg', subtitle: 'Sports Bras' },
  { id: 'jackets',   label: 'JACKETS',     placeholder: '/images/category-jackets.jpg', subtitle: 'Jackets' },
  { id: 'sets',      label: 'SETS',        placeholder: '/images/category-sets.PNG', subtitle: 'Sets' },
];

// ─── Products ─────────────────────────────────────────────────────
export const PRODUCTS = [
  {
    id:          'power-flow-leggings',
    name:        'POWER FLOW LEGGINGS',
    price:       'R 649.00',
    placeholder: '/images/prod-leggings.PNG',
    subtitle:    'Product 1',
    featured:    false,
  },
  {
    id:          'fearless-set',
    name:        'FEARLESS SET — RED/BLACK',
    price:       'R 1 099.00',
    placeholder: '/images/prod-fearless-set.PNG',
    subtitle:    'Product 2 (Featured)',
    featured:    true,
  },
  {
    id:          'avo-sports-bra',
    name:        'AVO SPORTS BRA',
    price:       'R 449.00',
    placeholder: '/images/prod-avo-bra.jpeg',
    subtitle:    'Product 3',
    featured:    false,
  },
];

// ─── Lookbook Images ──────────────────────────────────────────────
export const LOOKBOOK = [
  { id: 'lb-1',  placeholder: '/images/lookbook-large-1.PNG', large: true,  subtitle: 'Lookbook large 1' },
  { id: 'lb-2',  placeholder: '/images/lookbook-small-1.PNG', large: false, subtitle: 'Lookbook small' },
  { id: 'lb-3',  placeholder: '/images/lookbook-small-2.PNG', large: false, subtitle: 'Lookbook small' },
  { id: 'lb-4',  placeholder: '/images/lookbook-large-2.PNG', large: true,  subtitle: 'Lookbook large 2' },
  { id: 'lb-5',  placeholder: '/images/lookbook-small-3.PNG', large: false, subtitle: 'Lookbook small' },
  { id: 'lb-6',  placeholder: '/images/lookbook-small-4.PNG', large: false, subtitle: 'Lookbook small' },
];

// ─── Ticker Text ──────────────────────────────────────────────────
export const TICKER_1 = 'RED AVO · AUTHENTIC · FEARLESS · MOVE WITH CONFIDENCE · BUILT FOR HER MOTION · RED AVO ·';
export const TICKER_2 = 'RED AVO · PINK COLLECTION · NAVY COLLECTION · NEW ARRIVALS · RED AVO ·';

// ─── Social Links ─────────────────────────────────────────────────
export const SOCIALS = [
  { id: 'instagram', label: 'Instagram', href: '#' },
  { id: 'tiktok',    label: 'TikTok',    href: '#' },
  { id: 'facebook',  label: 'Facebook',  href: '#' },
  { id: 'pinterest', label: 'Pinterest', href: '#' },
];
