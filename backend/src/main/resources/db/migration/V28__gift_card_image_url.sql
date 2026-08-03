-- ─────────────────────────────────────────────────────────────────────────────
-- V28 — Gift Card Image URL
-- Adds image_url to gift_cards to persist the design the card was purchased with
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE gift_cards ADD COLUMN image_url VARCHAR(255);
