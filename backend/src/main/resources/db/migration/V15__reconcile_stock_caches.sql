-- Recompute product_variants.stock_quantity from stock_levels
UPDATE product_variants pv
SET stock_quantity = COALESCE((
    SELECT SUM(sl.quantity)
    FROM stock_levels sl
    WHERE sl.variant_id = pv.id
), 0);

-- Recompute products.stock_quantity from product_variants
UPDATE products p
SET stock_quantity = COALESCE((
    SELECT SUM(pv.stock_quantity)
    FROM product_variants pv
    WHERE pv.product_id = p.id
), 0);
