-- V34: Add wishlist_items table for storefront customer wishlists
CREATE TABLE wishlist_items (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT    NOT NULL,
    product_id  BIGINT    NOT NULL,
    added_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist_customer_product UNIQUE (customer_id, product_id)
);
