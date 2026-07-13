// ── Stores ────────────────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').Store[]>} */
export async function fetchStores() {
  return apiFetch('/stores');
}

/** @returns {Promise<import('@red-avo/types').Store>} */
export async function createStore(store) {
  return apiFetch('/stores', { method: 'POST', body: JSON.stringify(store) });
}

/** @returns {Promise<import('@red-avo/types').Store>} */
export async function updateStore(id, store) {
  return apiFetch(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(store) });
}

export async function deleteStore(id) {
  return apiFetch(`/stores/${id}`, { method: 'DELETE' });
}

// ── Employees ─────────────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').User[]>} */
export async function fetchEmployees() {
  return apiFetch('/employees');
}

export async function deactivateEmployee(id) {
  return apiFetch(`/employees/${id}`, { method: 'DELETE' });
}

export async function registerEmployee(payload) {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

// ── Stock Transfers ───────────────────────────────────────────────────────────

/** @returns {Promise<import('@red-avo/types').StockTransfer[]>} */
export async function fetchTransfers() {
  return apiFetch('/stock/transfers');
}

/** @returns {Promise<import('@red-avo/types').StockTransfer>} */
export async function requestTransfer(payload) {
  return apiFetch('/stock/transfers/request', { method: 'POST', body: JSON.stringify(payload) });
}

/** @returns {Promise<import('@red-avo/types').StockTransfer>} */
export async function dispatchTransfer(id, dispatchQuantity) {
  return apiFetch(`/stock/transfers/${id}/dispatch`, { method: 'POST', body: JSON.stringify({ dispatchQuantity }) });
}

/** @returns {Promise<import('@red-avo/types').StockTransfer>} */
export async function receiveTransfer(id, receiveQuantity) {
  return apiFetch(`/stock/transfers/${id}/receive`, { method: 'POST', body: JSON.stringify({ receiveQuantity }) });
}

/** @returns {Promise<import('@red-avo/types').StockTransfer>} */
export async function resolveTransferVariance(id, resolution) {
  return apiFetch(`/stock/transfers/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) });
}
