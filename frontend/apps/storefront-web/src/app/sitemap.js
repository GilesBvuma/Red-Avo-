import { fetchProducts, fetchCollections } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redavowear.com';

export default async function sitemap() {
  const now = new Date();

  // Core static pages
  const staticRoutes = [
    {
      url: `${BASE_URL}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/our-story`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/size-chart`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/returns`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic products
  let productRoutes = [];
  try {
    const products = await fetchProducts();
    if (Array.isArray(products)) {
      productRoutes = products
        .filter(p => p.isActive !== false && p.id)
        .map(p => ({
          url: `${BASE_URL}/shop/${p.id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: 'daily',
          priority: 0.8,
        }));
    }
  } catch (err) {
    // Graceful fallback if backend is momentarily unreachable
    console.warn('[sitemap] Failed to fetch dynamic products:', err.message);
  }

  // Dynamic collections
  let collectionRoutes = [];
  try {
    const collections = await fetchCollections();
    if (Array.isArray(collections)) {
      collectionRoutes = collections
        .filter(c => c.slug)
        .map(c => ({
          url: `${BASE_URL}/collections/${c.slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.warn('[sitemap] Failed to fetch dynamic collections:', err.message);
  }

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
