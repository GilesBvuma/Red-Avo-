-- ─────────────────────────────────────────────────────────────────────────────
-- V6 — Order Cost of Sale
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders
ADD COLUMN cost_of_sale DOUBLE PRECISION DEFAULT 0.0;
