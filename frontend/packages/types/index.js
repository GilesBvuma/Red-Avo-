/**
 * @red-avo/types — Shared JSDoc type definitions
 *
 * Import in any frontend app:
 *   import { Product, Order } from '@red-avo/types';
 *
 * These are pure JSDoc typedefs — no runtime code, no build step needed.
 * They mirror the backend JPA entity structure so the POS and storefront
 * share the same mental model.
 */

// ── Product & Variants ────────────────────────────────────────────────────────

/**
 * @typedef {Object} ProductVariant
 * @property {number}  id
 * @property {number}  productId
 * @property {string}  color
 * @property {string}  size
 * @property {string}  sku          - Unique SKU string
 * @property {number}  costPrice    - What the business paid (for COGS, not shown to customer)
 * @property {number}  sellPrice    - Public selling price (before promotions)
 * @property {boolean} active
 */

/**
 * @typedef {Object} Product
 * @property {number}            id
 * @property {string}            name
 * @property {string}            category
 * @property {string}            sku
 * @property {number}            price         - Legacy flat price (deprecated once variants are wired)
 * @property {boolean}           onSale
 * @property {number}            salePrice
 * @property {number}            stockQuantity - Legacy flat quantity (deprecated)
 * @property {string}            stockStatus   - 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
 * @property {string}            imageUrl
 * @property {boolean}           isActive
 * @property {string}            description
 * @property {ProductVariant[]}  [variants]    - Populated when fetching with variants
 */

// ── Stock ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StockLevel
 * @property {number}         id
 * @property {number}         variantId
 * @property {number}         storeId
 * @property {number}         quantity
 */

/**
 * @typedef {'SALE'|'RECEIPT'|'ADJUSTMENT'|'TRANSFER_OUT'|'TRANSFER_IN'|'RETURN'|'WRITE_OFF'} LedgerReason
 *
 * @typedef {Object} StockLedgerEntry
 * @property {number}       id
 * @property {number}       variantId
 * @property {number}       storeId
 * @property {number}       quantityDelta
 * @property {LedgerReason} reasonCode
 * @property {string}       referenceId
 * @property {string}       actor
 * @property {string}       recordedAt    - ISO datetime
 */

/**
 * @typedef {'REQUESTED'|'DISPATCHED'|'RECEIVED'|'VARIANCE_PENDING'|'RESOLVED'} TransferStatus
 *
 * @typedef {Object} StockTransfer
 * @property {number}         id
 * @property {ProductVariant} variant
 * @property {Store}          fromStore
 * @property {Store}          toStore
 * @property {number}         requestedQuantity
 * @property {number}         [dispatchedQuantity]
 * @property {number}         [receivedQuantity]
 * @property {TransferStatus} status
 * @property {string}         requestedBy
 * @property {string}         [approvedBy]
 * @property {string}         [receivedBy]
 * @property {string}         [resolvedBy]
 * @property {string}         requestedAt
 * @property {string}         [dispatchedAt]
 * @property {string}         [receivedAt]
 * @property {string}         [resolvedAt]
 * @property {string}         [varianceReason]
 */

// ── Orders ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} OrderItem
 * @property {number} id
 * @property {number} productId
 * @property {string} productName
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} lineTotal
 */

/**
 * @typedef {Object} Order
 * @property {number}      id
 * @property {string}      invoiceNumber
 * @property {number}      customerId
 * @property {string}      customerName
 * @property {string}      customerEmail
 * @property {string}      customerPhone
 * @property {OrderItem[]} items
 * @property {number}      subtotal
 * @property {number}      vatAmount
 * @property {number}      total
 * @property {number}      [costOfSale]
 * @property {string}      paymentMethod
 * @property {number}      amountTendered
 * @property {number}      changeGiven
 * @property {string}      status  - 'COMPLETED' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
 * @property {string}      createdAt
 */

// ── Customers ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Customer
 * @property {number}  id
 * @property {string}  firstName
 * @property {string}  lastName
 * @property {string}  email
 * @property {string}  phoneNumber
 * @property {boolean} whatsappOptIn
 * @property {number}  totalPurchases
 * @property {number}  lifetimeValue
 * @property {string}  address
 * @property {string}  notes
 * @property {boolean} isActive
 * @property {string}  createdAt
 * @property {string}  lastPurchaseAt
 */

// ── Auth & Users ──────────────────────────────────────────────────────────────

/**
 * @typedef {'ADMIN'|'EMPLOYEE'} Role
 *
 * @typedef {Object} AuthToken
 * @property {string} token
 * @property {Role}   role
 * @property {number} storeId  - null for ADMIN
 * @property {string} username
 * @property {number} expiresIn
 */

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Store
 * @property {number}  id
 * @property {string}  name
 * @property {string}  address
 * @property {string}  region
 * @property {boolean} active
 * @property {string}  createdAt
 */

// ── Audit ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {'CREATE'|'UPDATE'|'DELETE'} AuditAction
 *
 * @typedef {Object} AuditLogEntry
 * @property {number}      id
 * @property {string}      actor
 * @property {Role}        role
 * @property {number}      storeId
 * @property {string}      entityType
 * @property {string}      entityId
 * @property {AuditAction} action
 * @property {string}      beforeJson
 * @property {string}      afterJson
 * @property {string}      occurredAt
 */

export {};
