-- ─────────────────────────────────────────────────────────────────────────────
-- V5 — Stock Transfers
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE stock_transfers (
    id                    BIGSERIAL PRIMARY KEY,
    variant_id            BIGINT NOT NULL REFERENCES product_variants (id),
    from_store_id         BIGINT NOT NULL REFERENCES stores (id),
    to_store_id           BIGINT NOT NULL REFERENCES stores (id),
    requested_quantity    INTEGER NOT NULL,
    dispatched_quantity   INTEGER,
    received_quantity     INTEGER,
    status                VARCHAR(30) NOT NULL, -- REQUESTED, DISPATCHED, RECEIVED, VARIANCE_PENDING, RESOLVED
    requested_by          VARCHAR(100),
    approved_by           VARCHAR(100), -- Who dispatched it
    received_by           VARCHAR(100),
    resolved_by           VARCHAR(100),
    requested_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    dispatched_at         TIMESTAMP,
    received_at           TIMESTAMP,
    resolved_at           TIMESTAMP,
    variance_reason       VARCHAR(255)
);
