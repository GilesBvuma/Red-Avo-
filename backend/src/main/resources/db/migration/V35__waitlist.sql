-- V35: Founding-member / drop waitlist table
-- Captures interest from potential customers before or between drops.
-- Unique on email to prevent duplicates; source tracks where sign-up came from.

CREATE TABLE IF NOT EXISTS waitlist (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(150)  NOT NULL UNIQUE,
    phone      VARCHAR(30),
    interest   VARCHAR(100),              -- e.g. "Leggings", "Sets", "Drop alerts"
    source     VARCHAR(50)  DEFAULT 'STOREFRONT',
    created_at TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist (created_at DESC);
