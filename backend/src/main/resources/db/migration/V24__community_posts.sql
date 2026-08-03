-- V24 — Community Posts
-- Instagram-style community grid managed from the admin Marketing page

CREATE TABLE community_posts (
    id               BIGSERIAL       PRIMARY KEY,
    instagram_handle VARCHAR(100)    NOT NULL,
    cover_image_url  TEXT            NOT NULL,
    media_url        TEXT            NOT NULL,
    media_type       VARCHAR(10)     NOT NULL CHECK (media_type IN ('VIDEO', 'IMAGE')),
    display_order    INTEGER         NOT NULL DEFAULT 0,
    active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_posts_active_order
    ON community_posts (active, display_order);
