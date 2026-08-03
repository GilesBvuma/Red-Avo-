-- ─────────────────────────────────────────────────────────────────────────────
-- V27 — Gift Card Tier Images
-- Adds a custom background image URL for gift card tiers
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE gift_card_tiers ADD COLUMN image_url VARCHAR(255);
