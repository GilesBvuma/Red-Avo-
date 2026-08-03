-- ─────────────────────────────────────────────────────────────────────────────
-- V26 — Gift Card Tiers
-- Replaces free-text gift card amounts with configurable 4-tier pricing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE gift_card_tiers (
    id SERIAL PRIMARY KEY,
    tier_level INT NOT NULL UNIQUE,       -- 1, 2, 3, 4
    name VARCHAR(50) NOT NULL,
    price_amount NUMERIC(10,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insert defaults (Standard, Gold, Premium, Platinum)
INSERT INTO gift_card_tiers (tier_level, name, price_amount) VALUES
(1, 'Standard', 25.00),
(2, 'Gold', 50.00),
(3, 'Premium', 75.00),
(4, 'Platinum', 100.00);

-- Update existing gift_cards table to reference the tier name
-- We don't link via FK strictly since prices can change, and we want to preserve historical meaning
ALTER TABLE gift_cards
    ADD COLUMN tier_name VARCHAR(50);
