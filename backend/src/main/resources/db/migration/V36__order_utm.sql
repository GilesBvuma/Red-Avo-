-- V36: Add UTM tracking columns to orders
-- Captures paid/organic traffic attribution at the point of purchase.

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS utm_source   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS utm_medium   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
    ADD COLUMN IF NOT EXISTS utm_content  VARCHAR(100);
