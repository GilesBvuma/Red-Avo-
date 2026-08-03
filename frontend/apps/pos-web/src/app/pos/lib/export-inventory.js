/**
 * Client-side export utility for Inventory (Products + Variants).
 * Generates and downloads a .xlsx file using SheetJS (xlsx npm package).
 * No network request — works entirely in the browser.
 *
 * Usage:
 *   import { exportInventoryToXlsx } from '../lib/export-inventory';
 *   exportInventoryToXlsx(products);
 *
 * Expects an array of Product objects with nested `variants` array,
 * as returned by GET /api/products.
 */

export async function exportInventoryToXlsx(products, filename = 'inventory') {
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));

  const headers = [
    'Product ID',
    'Product Name',
    'Category',
    'SKU',
    'Variant Color',
    'Variant Size',
    'Variant SKU',
    'Sell Price',
    'Cost Price',
    'Stock Quantity',
    'Low Stock Threshold',
    'Stock Status',
    'On Sale',
    'Sale Price',
    'Description',
    'Active',
    'Last Updated',
  ];

  const rows = [];

  for (const product of products || []) {
    const variants = product.variants || [];

    if (variants.length === 0) {
      // Product with no variants — output one row
      rows.push([
        product.id ?? '',
        product.name ?? '',
        product.category ?? '',
        product.sku ?? '',
        '',   // no variant color
        '',   // no variant size
        '',   // no variant sku
        Number(product.price ?? 0).toFixed(2),
        '',
        product.stockQuantity ?? 0,
        product.lowStockThreshold ?? 5,
        product.stockStatus ?? '',
        product.onSale ? 'Yes' : 'No',
        product.salePrice ? Number(product.salePrice).toFixed(2) : '',
        product.description ?? '',
        product.isActive ? 'Active' : 'Inactive',
        product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-GB') : '',
      ]);
    } else {
      // One row per variant
      for (const v of variants) {
        rows.push([
          product.id ?? '',
          product.name ?? '',
          product.category ?? '',
          product.sku ?? '',
          v.color ?? '',
          v.size ?? '',
          v.sku ?? '',
          Number(v.sellPrice ?? product.price ?? 0).toFixed(2),
          Number(v.costPrice ?? 0).toFixed(2),
          v.stockQuantity ?? 0,
          product.lowStockThreshold ?? 5,
          product.stockStatus ?? '',
          product.onSale ? 'Yes' : 'No',
          product.salePrice ? Number(product.salePrice).toFixed(2) : '',
          product.description ?? '',
          v.active ? 'Active' : 'Inactive',
          product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-GB') : '',
        ]);
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  ws['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 16 },
    { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 14 },
    { wch: 8  }, { wch: 12 }, { wch: 30 }, { wch: 10 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
}
