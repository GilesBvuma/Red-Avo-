/**
 * Client-side export utility for Customers.
 * Generates and downloads a .xlsx file using SheetJS (xlsx npm package).
 * No network request — works entirely in the browser.
 *
 * Usage:
 *   import { exportCustomersToXlsx } from '../lib/export-customers';
 *   exportCustomersToXlsx(customers);
 */

export async function exportCustomersToXlsx(customers, filename = 'customers') {
  // Lazy-load xlsx to avoid it being in the initial bundle
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));

  const headers = [
    'Customer ID',
    'Customer Code',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Address',
    'Notes',
    'Points Balance (Lifetime Value)',
    'Total Purchases',
    'Last Purchase',
    'First Visit',
    'WhatsApp Opt-In',
    'Active',
    'Created At',
  ];

  const rows = (customers || []).map(c => [
    c.id ?? '',
    c.customerCode ?? '',
    c.firstName ?? '',
    c.lastName ?? '',
    c.email ?? '',
    c.phoneNumber ?? '',
    c.address ?? '',
    c.notes ?? '',
    Number(c.lifetimeValue ?? 0).toFixed(2),
    c.totalPurchases ?? 0,
    c.lastPurchaseAt ? new Date(c.lastPurchaseAt).toLocaleDateString('en-GB') : '',
    c.firstVisitAt   ? new Date(c.firstVisitAt).toLocaleDateString('en-GB')   : '',
    c.whatsappOptIn ? 'Yes' : 'No',
    c.isActive ? 'Active' : 'Inactive',
    c.createdAt ? new Date(c.createdAt).toLocaleString('en-GB') : '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Customer ID
    { wch: 15 }, // Customer Code
    { wch: 18 }, // First Name
    { wch: 18 }, // Last Name
    { wch: 30 }, // Email
    { wch: 18 }, // Phone
    { wch: 35 }, // Address
    { wch: 30 }, // Notes
    { wch: 22 }, // Lifetime Value
    { wch: 16 }, // Total Purchases
    { wch: 18 }, // Last Purchase
    { wch: 18 }, // First Visit
    { wch: 14 }, // WhatsApp
    { wch: 10 }, // Active
    { wch: 20 }, // Created At
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
}
