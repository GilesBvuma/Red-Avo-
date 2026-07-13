-- ─────────────────────────────────────────────────────────────────────────────
-- V7 — Order Items Variant ID
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE order_items
ADD COLUMN variant_id BIGINT REFERENCES product_variants(id);
