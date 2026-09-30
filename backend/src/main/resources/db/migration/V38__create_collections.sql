-- V38: Create collections and collection_products tables
-- Admin-curated product collections for the storefront /collections page

CREATE TABLE IF NOT EXISTS collections (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255)  NOT NULL,
    slug             VARCHAR(255)  NOT NULL UNIQUE,
    description      TEXT,
    cover_image_url  TEXT,
    hero_image_url   TEXT,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    sort_order       INTEGER       NOT NULL DEFAULT 0,
    created_at       TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_products (
    collection_id BIGINT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id    BIGINT NOT NULL REFERENCES products(id)    ON DELETE CASCADE,
    PRIMARY KEY (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_slug      ON collections (slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON collections (is_active, sort_order);
