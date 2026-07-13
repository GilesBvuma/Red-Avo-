-- ─────────────────────────────────────────────────────────────────────────────
-- V1 — Fresh schema (clean slate wipe + recreate all baseline tables)
-- Executed by Flyway on first startup against an empty flyway_schema_history.
-- Drops any tables that may have been created by Hibernate's ddl-auto=update,
-- then recreates them precisely so Hibernate validate mode passes.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old tables (order matters: child tables before parents)
DROP TABLE IF EXISTS notification_logs   CASCADE;
DROP TABLE IF EXISTS order_items         CASCADE;
DROP TABLE IF EXISTS orders              CASCADE;
DROP TABLE IF EXISTS customers           CASCADE;
DROP TABLE IF EXISTS products            CASCADE;

-- ── products ─────────────────────────────────────────────────────────────────
CREATE TABLE products (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255),
    category            VARCHAR(255),
    sku                 VARCHAR(255),
    price               DOUBLE PRECISION,
    on_sale             BOOLEAN          DEFAULT FALSE,
    sale_price          DOUBLE PRECISION,
    stock_quantity      INTEGER          DEFAULT 0,
    low_stock_threshold INTEGER          DEFAULT 5,
    stock_status        VARCHAR(50),
    colors              TEXT,
    sizes               TEXT,
    vat_rate            DOUBLE PRECISION DEFAULT 15.0,
    discount            INTEGER          DEFAULT 0,
    image_url           TEXT,
    is_active           BOOLEAN          DEFAULT TRUE,
    description         VARCHAR(255)
);

-- ── customers ─────────────────────────────────────────────────────────────────
CREATE TABLE customers (
    id               BIGSERIAL PRIMARY KEY,
    first_name       VARCHAR(255),
    last_name        VARCHAR(255),
    email            VARCHAR(255) UNIQUE,
    phone_number     VARCHAR(255),
    whatsapp_opt_in  BOOLEAN          DEFAULT FALSE,
    total_purchases  INTEGER          DEFAULT 0,
    lifetime_value   DOUBLE PRECISION DEFAULT 0.0,
    address          VARCHAR(255),
    notes            VARCHAR(255),
    is_active        BOOLEAN          DEFAULT TRUE,
    created_at       TIMESTAMP,
    last_purchase_at TIMESTAMP
);

-- ── orders ────────────────────────────────────────────────────────────────────
CREATE TABLE orders (
    id               BIGSERIAL PRIMARY KEY,
    invoice_number   VARCHAR(255) UNIQUE,
    customer_id      BIGINT,
    customer_name    VARCHAR(255),
    customer_email   VARCHAR(255),
    customer_phone   VARCHAR(255),
    subtotal         DOUBLE PRECISION DEFAULT 0.0,
    vat_amount       DOUBLE PRECISION DEFAULT 0.0,
    tax              DOUBLE PRECISION,
    total            DOUBLE PRECISION,
    payment_method   VARCHAR(255),
    amount_tendered  DOUBLE PRECISION,
    change_given     DOUBLE PRECISION,
    status           VARCHAR(50)      DEFAULT 'COMPLETED',
    created_at       TIMESTAMP
);

-- ── order_items ───────────────────────────────────────────────────────────────
CREATE TABLE order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT REFERENCES orders (id),
    product_id   BIGINT,
    product_name VARCHAR(255),
    quantity     INTEGER,
    unit_price   DOUBLE PRECISION,
    line_total   DOUBLE PRECISION
);

-- ── notification_logs ─────────────────────────────────────────────────────────
CREATE TABLE notification_logs (
    id               BIGSERIAL PRIMARY KEY,
    customer_id      BIGINT,
    customer_name    VARCHAR(255),
    contact          VARCHAR(255),
    type             VARCHAR(50),
    message          VARCHAR(2000),
    status           VARCHAR(50),
    order_reference  VARCHAR(255),
    sent_at          TIMESTAMP
);
