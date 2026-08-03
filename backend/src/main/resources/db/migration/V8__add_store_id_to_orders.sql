-- V4__add_store_id_to_orders.sql

-- Add store_id to orders table
ALTER TABLE orders ADD COLUMN store_id BIGINT;

-- Backfill existing orders to belong to the main store (Store ID 1)
UPDATE orders SET store_id = 1 WHERE store_id IS NULL;
