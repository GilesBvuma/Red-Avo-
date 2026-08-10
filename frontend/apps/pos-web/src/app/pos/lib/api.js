'use client';

// All API calls to Spring Boot backend at localhost:8080

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Tracks whether a session-expired redirect is already in flight so we
// don't fire multiple simultaneous redirects from parallel API calls.
let _redirectingToLogin = false;

async function apiFetch(endpoint, options = {}) {
  try {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('redavo_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // No token yet — AuthProvider will handle the redirect once it
        // finishes its own initialisation. Don't alert or redirect here.
        throw new Error('No authentication token found');
      }
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      // 401 = token invalid / expired → clear session and go to login
      // 403 = authenticated but not authorised → let the page handle it
      if (res.status === 401 && typeof window !== 'undefined') {
        if (!_redirectingToLogin) {
          _redirectingToLogin = true;
          sessionStorage.removeItem('redavo_token');
          sessionStorage.removeItem('redavo_user');
          window.location.href = '/auth/role-select?reason=session-expired';
        }
      }
      const error = await res.text();
      throw new Error(error || `HTTP ${res.status}`);
    }
    
    // 204 No Content has no body, so don't try to parse it
    if (res.status === 204) {
      return null;
    }
    
    // For some endpoints that might return empty text but status 200
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
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
    const token = sessionStorage.getItem('redavo_token');
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

export async function uploadProductInvoices(id, files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const headers = {};
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('redavo_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/products/${id}/invoices`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error('Invoice upload failed');
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

export async function updateCategory(id, data) {
  return apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function uploadCategoryImage(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const headers = {};
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('redavo_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}/categories/${id}/image`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Image upload failed');
  }
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
  return apiFetch(`/customers/${id}`, { method: 'DELETE' });
}

export async function sendBulkEmail(payload) {
  return apiFetch('/customers/bulk-email', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Admin Reviews ──────────────────────────────────────────────────────
export async function fetchPendingReviews() {
  return apiFetch('/admin/reviews?pendingOnly=true');
}

export async function approveReview(id) {
  return apiFetch(`/admin/reviews/${id}/approve`, { method: 'PUT' });
}

export async function deleteReview(id) {
  return apiFetch(`/admin/reviews/${id}`, { method: 'DELETE' });
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

// ── Marketing & Communications ───────────────────────────────────────
export async function sendNewsletter(payload) {
  return apiFetch('/marketing/newsletter', { method: 'POST', body: JSON.stringify(payload) });
}

export async function sendSmsBlast(payload) {
  return apiFetch('/marketing/sms', { method: 'POST', body: JSON.stringify(payload) });
}

export async function sendWhatsAppBlast(payload) {
  return apiFetch('/marketing/whatsapp', { method: 'POST', body: JSON.stringify(payload) });
}

export async function validateGiftCard(code) {
  return apiFetch(`/gift-cards/validate/${encodeURIComponent(code)}`);
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

// ── Excel Import ──────────────────────────────────────────────────
/**
 * Uploads a customer .xlsx file to the backend for batch upsert.
 * DO NOT set Content-Type manually — let the browser set the multipart boundary.
 */
export async function importCustomerExcel(file) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('redavo_token') : null;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/customers/import`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Uploads an inventory .xlsx file to the backend for batch upsert.
 * DO NOT set Content-Type manually — let the browser set the multipart boundary.
 */
export async function importInventoryExcel(file) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('redavo_token') : null;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/products/import`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchNotificationHistory() {

  return apiFetch('/notify/history');
}

export async function fetchContactMessages() {
  return apiFetch('/admin/contact');
}

export async function markContactMessageRead(id) {
  return apiFetch(`/admin/contact/${id}/read`, { method: 'POST' });
}

// ── Transfers & Stores & Stock ────────────────────────────────────────────
export async function fetchStockLevels(storeId) {
  const query = storeId ? `?storeId=${storeId}` : '';
  return apiFetch(`/stock/levels${query}`);
}

export async function fetchTransfers() {
  return apiFetch('/stock/transfers');
}

export async function requestTransfer(payload) {
  return apiFetch('/stock/transfers/request', { method: 'POST', body: JSON.stringify(payload) });
}

export async function dispatchTransfer(id, dispatchedQuantity) {
  return apiFetch(`/stock/transfers/${id}/dispatch`, {
    method: 'POST',
    body: JSON.stringify({ dispatchQuantity: dispatchedQuantity }),
  });
}

export async function receiveTransfer(id, receivedQuantity) {
  return apiFetch(`/stock/transfers/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify({ receiveQuantity: receivedQuantity }),
  });
}

export async function resolveTransferVariance(id, resolution) {
  return apiFetch(`/stock/transfers/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  });
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

export async function fetchEmployeeTransfers(id) {
  return apiFetch(`/employees/${id}/transfers`);
}

export async function fetchEmployeeRecentSales(id) {
  return apiFetch(`/employees/${id}/recent-sales`);
}

export async function fetchStoreDashboard(id) {
  return apiFetch(`/stores/${id}/dashboard`);
}

// ── Community (Admin) ─────────────────────────────────────────────

export async function fetchAdminCommunityPosts() {
  return apiFetch('/admin/community');
}

export async function createCommunityPost(dto) {
  return apiFetch('/admin/community', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateCommunityPost(id, dto) {
  return apiFetch(`/admin/community/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export async function deleteCommunityPost(id) {
  return apiFetch(`/admin/community/${id}`, { method: 'DELETE' });
}

export async function toggleCommunityPostActive(id) {
  return apiFetch(`/admin/community/${id}/active`, { method: 'PATCH' });
}

export async function uploadCommunityFile(file, type = 'media') {
  const formData = new FormData();
  formData.append('file', file);
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('redavo_token') : null;
  const res = await fetch(`${API_BASE}/admin/community/upload?type=${type}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Upload failed');
  }
  return res.json(); // { url: "/uploads/..." }
}

// ── Gift Cards ─────────────────────────────────────────────────────────────
export const fetchGiftCards = () => apiFetch('/admin/gift-cards');
export const voidGiftCard   = (id) => apiFetch(`/admin/gift-cards/${id}/void`, { method: 'POST' });
export const releaseGiftCard = (id) => apiFetch(`/admin/gift-cards/${id}/release-now`, { method: 'POST' });
export const fetchGiftCardLedger = (id) => apiFetch(`/admin/gift-cards/${id}/ledger`);
export const fetchTiers = () => apiFetch('/gift-cards/tiers');
export const updateTier = (id, data) => apiFetch(`/admin/gift-cards/tiers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ── Colors ─────────────────────────────────────────────────────────────────
/** Fetches the full colors palette from the database (sorted A–Z). */
export const fetchColors = () => apiFetch('/colors');

/**
 * Persists a new custom color.
 * @param {{ name: string, hexCode: string }} data
 */
export const createColor = (data) =>
  apiFetch('/colors', { method: 'POST', body: JSON.stringify(data) });

