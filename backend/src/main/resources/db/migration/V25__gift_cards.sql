-- ─────────────────────────────────────────────────────────────────────────────
-- V25 — Gift Cards system
-- Adds gift_cards table (stored-value payment instrument),
-- gift_card_ledger (redemption history per card),
-- and two new columns on orders to track gift card usage.
-- Gift cards never expire (expires_at is always NULL by design).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── gift_cards ────────────────────────────────────────────────────────────────
CREATE TABLE gift_cards (
    id                BIGSERIAL    PRIMARY KEY,
    code              VARCHAR(20)  NOT NULL UNIQUE,       -- GC-XXXX-XXXX-XXXX
    initial_balance   NUMERIC(10,2) NOT NULL,
    remaining_balance NUMERIC(10,2) NOT NULL,
    purchaser_email   VARCHAR(255) NOT NULL,
    purchaser_name    VARCHAR(255),
    recipient_email   VARCHAR(255) NOT NULL,
    recipient_name    VARCHAR(255),
    personal_message  TEXT,
    recipient_birthday DATE,                              -- for birthday reminder cron
    delivered         BOOLEAN      NOT NULL DEFAULT FALSE,
    delivery_held     BOOLEAN      NOT NULL DEFAULT FALSE,-- fraud hold flag
    release_at        TIMESTAMP,                          -- when to auto-release held card
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING|ACTIVE|REDEEMED|VOIDED
    purchased_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at        TIMESTAMP                           -- always NULL (never expires)
);

-- ── gift_card_ledger ──────────────────────────────────────────────────────────
CREATE TABLE gift_card_ledger (
    id             BIGSERIAL    PRIMARY KEY,
    gift_card_id   BIGINT       NOT NULL REFERENCES gift_cards (id) ON DELETE CASCADE,
    amount_used    NUMERIC(10,2) NOT NULL,
    balance_after  NUMERIC(10,2) NOT NULL,
    redeemed_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    order_id       BIGINT       REFERENCES orders (id)
);

-- ── orders — add gift card columns ────────────────────────────────────────────
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS gift_card_code        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gift_card_amount_used DOUBLE PRECISION DEFAULT 0.0;
