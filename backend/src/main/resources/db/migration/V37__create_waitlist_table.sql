-- V37: Create waitlist table (recovery migration)
-- V35 was repaired in schema history but the waitlist table was never
-- physically created (the original V35 in the DB had different content).
-- This migration creates it safely with IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS waitlist (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(150)  NOT NULL UNIQUE,
    phone      VARCHAR(30),
    interest   VARCHAR(100),
    source     VARCHAR(50)  DEFAULT 'STOREFRONT',
    created_at TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email      ON waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist (created_at DESC);
