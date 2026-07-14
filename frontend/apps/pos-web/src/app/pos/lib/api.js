'use client';

// All API calls to Spring Boot backend at localhost:8080

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function apiFetch(endpoint, options = {}) {
  try {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('redavo_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
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
  return apiFetch(`/products/${id}`, { method: 'DELETE' });
}

export async function uploadProductImages(id, files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const headers = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('redavo_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/products/${id}/images`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error('Image upload failed');
  return res.json();
}

// ── Categories ────────────────────────────────────────────────────
export async function fetchCategories() {
  return apiFetch('/categories');
}

export async function createCategory(data) {
  return apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteCategory(id) {
  return apiFetch(`/categories/${id}`, { method: 'DELETE' });
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
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
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

export async function confirmOrder(id) {
  return apiFetch(`/orders/${id}/confirm`, { method: 'POST' });
}

export async function fulfilOrder(id, action) {
  return apiFetch(`/orders/${id}/fulfil?action=${encodeURIComponent(action)}`, { method: 'POST' });
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

// ── Transfers & Stores ────────────────────────────────────────────
export async function fetchTransfers() {
  return apiFetch('/stock/transfers');
}

export async function requestTransfer(payload) {
  return apiFetch('/stock/transfers/request', { method: 'POST', body: JSON.stringify(payload) });
}

export async function dispatchTransfer(id, dispatchedQuantity) {
  return apiFetch(`/stock/transfers/${id}/dispatch?dispatchedQuantity=${dispatchedQuantity}`, { method: 'POST' });
}

export async function receiveTransfer(id, receivedQuantity) {
  return apiFetch(`/stock/transfers/${id}/receive?receivedQuantity=${receivedQuantity}`, { method: 'POST' });
}

export async function resolveTransferVariance(id, resolution) {
  return apiFetch(`/stock/transfers/${id}/resolve?resolution=${resolution}`, { method: 'POST' });
}
export async function createStore(payload) {
  return apiFetch('/stores', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Financials ────────────────────────────────────────────────────
export async function fetchFinancialSummary(storeId, startDate, endDate) {
  let query = '?';
  if (storeId) query += `storeId=${storeId}&`;
  if (startDate) query += `startDate=${encodeURIComponent(startDate)}&`;
  if (endDate) query += `endDate=${encodeURIComponent(endDate)}&`;
  return apiFetch(`/financials/summary${query}`);
}
export async function fetchStores() {
  return apiFetch('/stores');
}

// ── Employees ─────────────────────────────────────────────────────
export async function fetchEmployees() {
  return apiFetch('/employees');
}

export async function deleteEmployee(id) {
  return apiFetch(`/employees/${id}`, { method: 'DELETE' });
}

export async function changeEmployeePassword(id, newPassword) {
  return apiFetch(`/employees/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  });
}

export async function fetchEmployeeStats(id) {
  return apiFetch(`/employees/${id}/stats`);
}

export async function fetchEmployeeRecentSales(id) {
  return apiFetch(`/employees/${id}/recent-sales`);
}

export async function fetchStoreDashboard(id) {
  return apiFetch(`/stores/${id}/dashboard`);
}
