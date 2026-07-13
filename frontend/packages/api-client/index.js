/**
 * @red-avo/api-client
 *
 * Shared API client for all Red Avo frontend apps.
 * Both `apps/pos-web` and `apps/storefront-web` import from here —
 * endpoint URLs and fetch logic are defined in exactly one place.
 *
 * Usage:
 *   import { fetchProducts, createOrder } from '@red-avo/api-client';
 *
 * Auth:
 *   Call `setAuthToken(token)` after login to attach the JWT Bearer header
 *   automatically to all subsequent requests. The token is stored in memory
 *   only — never persisted to localStorage from this module.
 */

'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// ── In-memory auth token ──────────────────────────────────────────────────────
let _authToken = null;

export function setAuthToken(token) {
  _authToken = token;
}

export function clearAuthToken() {
  _authToken = null;
}

export function getAuthToken() {
  return _authToken;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `HTTP ${res.status}`);
    }

    // 204 No Content — return null
    if (res.status === 204) return null;

    return await res.json();
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    throw err;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Log in and return an AuthToken object.
 * Call setAuthToken(result.token) after this to attach the JWT.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<import('@red-avo/types').AuthToken>}
 */
export async function login(username, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

// ── Products ──────────────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').Product[]>} */
export async function fetchProducts() {
  return apiFetch('/products');
}

/** @returns {Promise<import('@red-avo/types').Product[]>} */
export async function fetchProductsByCategory(category) {
  return apiFetch(`/products/category/${encodeURIComponent(category)}`);
}

/** @returns {Promise<import('@red-avo/types').Product>} */
export async function createProduct(product) {
  return apiFetch('/products', { method: 'POST', body: JSON.stringify(product) });
}

/** @returns {Promise<import('@red-avo/types').Product>} */
export async function updateProduct(id, product) {
  return apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

/** @returns {Promise<import('@red-avo/types').Product>} */
export async function updateProductStock(id, quantity) {
  return apiFetch(`/products/${id}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

/** @returns {Promise<null>} */
export async function deleteProduct(id) {
  return apiFetch(`/products/${id}`, { method: 'DELETE' });
}

/** Upload a product image. Returns { imageUrl: string }. */
export async function uploadProductImage(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const headers = {};
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;

  const res = await fetch(`${API_BASE}/products/${id}/image`, {
    method: 'POST',
    body: formData,
    headers,
  });
  if (!res.ok) throw new Error('Image upload failed');
  return res.json();
}

// ── Product Variants ──────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').ProductVariant[]>} */
export async function fetchVariants(productId) {
  return apiFetch(`/stock/products/${productId}/variants`);
}

/** @returns {Promise<import('@red-avo/types').ProductVariant>} */
export async function createVariant(productId, variant) {
  return apiFetch(`/stock/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify(variant),
  });
}

// ── Stock ─────────────────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').StockLevel[]>} */
export async function fetchStockLevels(storeId) {
  return apiFetch(`/stock/levels?storeId=${storeId}`);
}

/**
 * Apply a stock delta (ADMIN/EMPLOYEE — own store only).
 * @param {{ variantId: number, storeId: number, delta: number, reason: string, referenceId?: string }} payload
 */
export async function applyStockDelta(payload) {
  return apiFetch('/stock/ledger', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** @returns {Promise<import('@red-avo/types').StockLedgerEntry[]>} */
export async function fetchStockLedger(variantId, storeId) {
  return apiFetch(`/stock/ledger?variantId=${variantId}&storeId=${storeId}`);
}

// ── Customers ─────────────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').Customer[]>} */
export async function fetchCustomers() {
  return apiFetch('/customers');
}

/** @returns {Promise<import('@red-avo/types').Customer>} */
export async function createCustomer(customer) {
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(customer) });
}

/** @returns {Promise<import('@red-avo/types').Customer>} */
export async function updateCustomer(id, customer) {
  return apiFetch(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  });
}

/** @returns {Promise<null>} */
export async function deleteCustomer(id) {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}

export async function sendBulkEmail(payload) {
  return apiFetch('/customers/bulk-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').Order[]>} */
export async function fetchOrders() {
  return apiFetch('/orders');
}

/** @returns {Promise<import('@red-avo/types').Order>} */
export async function createOrder(order) {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  return apiFetch('/dashboard/stats');
}

export async function fetchChannelStatus() {
  return apiFetch('/dashboard/channels');
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function sendEmailNotification(payload) {
  return apiFetch('/notify/email', { method: 'POST', body: JSON.stringify(payload) });
}

export async function sendWhatsAppNotification(payload) {
  return apiFetch('/notify/whatsapp', { method: 'POST', body: JSON.stringify(payload) });
}

export async function sendSmsNotification(payload) {
  return apiFetch('/notify/sms', { method: 'POST', body: JSON.stringify(payload) });
}

export async function sendBulkNotification(payload) {
  return apiFetch('/notify/bulk', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchNotificationHistory() {
  return apiFetch('/notify/history');
}

// ── Audit ─────────────────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').AuditLogEntry[]>} */
export async function fetchAuditLog() {
  return apiFetch('/audit');
}

/** @returns {Promise<import('@red-avo/types').AuditLogEntry[]>} */
export async function fetchEntityAuditHistory(entityType, entityId) {
  return apiFetch(`/audit/${entityType}/${entityId}`);
}
