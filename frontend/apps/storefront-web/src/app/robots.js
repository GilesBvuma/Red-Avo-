const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redavowear.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/account',
          '/cart',
          '/wishlist',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
