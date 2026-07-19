-- V16: Full stock cache reconciliation
-- Wipes all legacy/corrupted stock state and recomputes everything bottom-up
-- from the stock_ledger (the only source of truth).
--
-- Step 1: Recompute stock_levels.quantity from the ledger (per variant × store)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE stock_levels sl
SET quantity = COALESCE((
    SELECT SUM(sl2.quantity_delta)
    FROM stock_ledger sl2
    WHERE sl2.variant_id = sl.variant_id
      AND sl2.store_id   = sl.store_id
), 0);

-- Step 2: Recompute product_variants.stock_quantity = SUM across all stores
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE product_variants pv
SET stock_quantity = COALESCE((
    SELECT SUM(sl.quantity)
    FROM stock_levels sl
    WHERE sl.variant_id = pv.id
), 0);

-- Step 3: Recompute products.stock_quantity = SUM of all variant totals
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE products p
SET stock_quantity = COALESCE((
    SELECT SUM(pv.stock_quantity)
    FROM product_variants pv
    WHERE pv.product_id = p.id
), 0);

-- Step 4: Recompute stock_status for every product
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE products
SET stock_status = CASE
    WHEN stock_quantity IS NULL OR stock_quantity = 0 THEN 'OUT_OF_STOCK'
    WHEN stock_quantity <= low_stock_threshold        THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
END;
