-- ─────────────────────────────────────────────────────────────────────────────
-- V4 — Audit log
-- Stores before/after JSON snapshots for every create/update/delete event
-- on tracked entities (Product, Order, Customer, User, Store, StockLevel,
-- Promotion). Populated automatically by AuditAspect.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor       VARCHAR(100)  NOT NULL,          -- username from JWT (or 'system' for seeder)
    role        VARCHAR(20),                      -- ADMIN | EMPLOYEE
    store_id    BIGINT,                           -- store context from JWT claim
    entity_type VARCHAR(100)  NOT NULL,           -- e.g. 'Product', 'Order'
    entity_id   VARCHAR(100)  NOT NULL,           -- stringified primary key
    action      VARCHAR(10)   NOT NULL,           -- CREATE | UPDATE | DELETE
    before_json TEXT,                             -- JSON snapshot before change (null for CREATE)
    after_json  TEXT,                             -- JSON snapshot after change (null for DELETE)
    occurred_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Index for admin audit dashboard queries
CREATE INDEX idx_audit_log_entity        ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor         ON audit_log (actor);
CREATE INDEX idx_audit_log_occurred_at   ON audit_log (occurred_at DESC);
