-- ─────────────────────────────────────────────────────────────────────────────
-- V3 — Product variants, stock levels, stock ledger
-- Replaces flat Product.colors / Product.sizes / Product.stockQuantity with a
-- proper variant model. Old columns on `products` are preserved (deprecated)
-- so the existing POS frontend keeps working while Phase 2 wires it to variants.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── stores ────────────────────────────────────────────────────────────────────
-- Introduced here because StockLevel references a store.
-- Full Store management endpoints are added in Phase 2.
CREATE TABLE stores (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255)  NOT NULL,
    address    VARCHAR(500),
    region     VARCHAR(100),
    active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Default "Main Store" — back-fills context for existing orders (store_id NULL).
INSERT INTO stores (name, address, region, active)
VALUES ('Main Store', 'Harare, Zimbabwe', 'Harare', TRUE);

-- ── product_variants ──────────────────────────────────────────────────────────
-- Each variant is one concrete SKU (colour × size combination).
-- cost_price and sell_price use NUMERIC for accurate financial arithmetic.
CREATE TABLE product_variants (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT           NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    color       VARCHAR(100),
    size        VARCHAR(50),
    sku         VARCHAR(255)     UNIQUE NOT NULL,
    cost_price  NUMERIC(19, 4)   NOT NULL DEFAULT 0.0000,
    sell_price  NUMERIC(19, 4)   NOT NULL DEFAULT 0.0000,
    active      BOOLEAN          NOT NULL DEFAULT TRUE
);

-- ── stock_levels ──────────────────────────────────────────────────────────────
-- Materialised quantity per variant × store.
-- NEVER update quantity directly from application code — always go via
-- stock_ledger and StockLedgerService.applyDelta().
CREATE TABLE stock_levels (
    id         BIGSERIAL PRIMARY KEY,
    variant_id BIGINT  NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
    store_id   BIGINT  NOT NULL REFERENCES stores (id),
    quantity   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (variant_id, store_id)
);

-- ── stock_ledger ──────────────────────────────────────────────────────────────
-- Append-only. Every stock mutation writes a row here.
-- Current stock is derived from SUM(quantity_delta) per variant × store,
-- but stock_levels.quantity is kept in sync for query performance.
-- reason_code values mirror the Java LedgerReason enum.
CREATE TABLE stock_ledger (
    id             BIGSERIAL PRIMARY KEY,
    variant_id     BIGINT       NOT NULL REFERENCES product_variants (id),
    store_id       BIGINT       NOT NULL REFERENCES stores (id),
    quantity_delta INTEGER      NOT NULL,                       -- positive = in, negative = out
    reason_code    VARCHAR(30)  NOT NULL,                       -- SALE | RECEIPT | ADJUSTMENT | etc.
    reference_id   VARCHAR(255),                                -- order ID, transfer ID, etc.
    actor          VARCHAR(100) NOT NULL,                       -- username from JWT
    recorded_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Index for fast "current stock" queries per variant/store
CREATE INDEX idx_stock_ledger_variant_store ON stock_ledger (variant_id, store_id);
