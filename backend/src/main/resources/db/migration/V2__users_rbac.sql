-- ─────────────────────────────────────────────────────────────────────────────
-- V2 — RBAC: users table
-- Introduces a users table for JWT-based authentication.
-- Role is stored as a VARCHAR matching the Java Role enum names.
-- store_id is nullable: NULL means ADMIN (cross-store access).
--
-- NOTE: The initial ADMIN user account is NOT seeded here.
-- It is created at application startup by DataSeeder.ensureAdminExists()
-- which BCrypt-hashes the password at runtime — guaranteeing correctness.
-- To override the default credentials set the ADMIN_USERNAME / ADMIN_PASSWORD
-- environment variables (Phase 5 — env-specific config).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    role          VARCHAR(20)         NOT NULL DEFAULT 'EMPLOYEE',
    store_id      BIGINT,                       -- NULL = ADMIN (no store restriction)
    active        BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP           NOT NULL DEFAULT NOW()
);
