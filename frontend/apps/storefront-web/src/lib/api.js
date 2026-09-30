export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function fetchProducts() {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_URL}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function initiatePaynowCheckout(payload) {
  const res = await fetch('/api/paynow/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to initiate checkout');
  return res.json();
}

export async function createOrder(payload) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function fetchCommunityPosts() {
  const res = await fetch(`${API_URL}/community`);
  if (!res.ok) throw new Error('Failed to fetch community posts');
  return res.json();
}

/** Fetches the full colour palette from the database (public endpoint, no auth needed). */
export async function fetchColors() {
  const res = await fetch(`${API_URL}/colors`);
  if (!res.ok) return []; // non-critical — fall back silently
  return res.json();
}

/** Fetches all active collections for the storefront collections page. */
export async function fetchCollections() {
  const res = await fetch(`${API_URL}/collections`);
  if (!res.ok) return [];
  return res.json();
}

/** Fetches a single collection by slug — used on /collections/[slug] page. */
export async function fetchCollectionBySlug(slug) {
  const res = await fetch(`${API_URL}/collections/${slug}`);
  if (!res.ok) throw new Error('Collection not found');
  return res.json();
}
