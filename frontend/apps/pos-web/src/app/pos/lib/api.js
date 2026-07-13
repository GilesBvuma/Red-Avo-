'use client';

// All API calls to Spring Boot backend at localhost:8080

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    throw err;
  }
}

// ── Products ──────────────────────────────────────────────────────
export async function fetchProducts() {
  return apiFetch('/products');
}

export async function fetchProductsByCategory(category) {
  return apiFetch(`/products/category/${encodeURIComponent(category)}`);
}

export async function createProduct(product) {
  return apiFetch('/products', { method: 'POST', body: JSON.stringify(product) });
}

export async function updateProductStock(id, quantity) {
  return apiFetch(`/products/${id}/stock`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function updateProduct(id, product) {
  return apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id) {
  return fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
}

export async function uploadProductImage(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/products/${id}/image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Image upload failed');
  return res.json();
}

// ── Customers ─────────────────────────────────────────────────────
export async function fetchCustomers() {
  return apiFetch('/customers');
}

export async function createCustomer(customer) {
  return apiFetch('/customers', { method: 'POST', body: JSON.stringify(customer) });
}

export async function updateCustomer(id, customer) {
  return apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) });
}

export async function deleteCustomer(id) {
  return fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
}

export async function sendBulkEmail(payload) {
  return apiFetch('/customers/bulk-email', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Orders ────────────────────────────────────────────────────────
export async function fetchOrders() {
  return apiFetch('/orders');
}

export async function createOrder(order) {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) });
}

// ── Dashboard ─────────────────────────────────────────────────────
export async function fetchDashboardStats() {
  return apiFetch('/dashboard/stats');
}

export async function fetchChannelStatus() {
  return apiFetch('/dashboard/channels');
}

// ── Notifications ─────────────────────────────────────────────────
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
