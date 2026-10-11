-- ─────────────────────────────────────────────────────────────────────────────
-- V35__fix_inverted_color_size_variants.sql
--
-- Root cause: InventoryExcelImportService rows 2+ had no option name context,
-- so size values (S, M, L, XL, Xs, Xl, 2XL) were stored in variant.color and
-- real colour names were stored in variant.size.
--
-- Fix:
--  1. Swap color and size on affected product_variants
--  2. Recompute products.colors and products.sizes from the corrected variants
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Swap inverted color/size on variant rows ────────────────────────────────
--    Affected rows: those where `color` matches a known clothing size token.
--    We swap only when size looks like a real colour (i.e., NOT another size token).
UPDATE product_variants
SET
    color = size,
    size  = color
WHERE UPPER(TRIM(color)) IN ('XXS','XS','S','M','L','XL','XXL','2XL','3XL','4XL','XXXL')
  AND size IS NOT NULL
  AND UPPER(TRIM(size)) NOT IN ('XXS','XS','S','M','L','XL','XXL','2XL','3XL','4XL','XXXL');

-- ── 2. Recompute products.colors from cleaned variants ────────────────────────
--    Excludes size tokens, gift-card price denominations, and nulls.
UPDATE products p
SET colors = (
    SELECT string_agg(DISTINCT pv.color, ',')
    FROM product_variants pv
    WHERE pv.product_id = p.id
      AND pv.color IS NOT NULL
      AND pv.color <> ''
      AND pv.color NOT LIKE '$%'
      AND UPPER(TRIM(pv.color)) NOT IN ('XXS','XS','S','M','L','XL','XXL','2XL','3XL','4XL','XXXL')
)
WHERE EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
);

-- ── 3. Recompute products.sizes from cleaned variants ─────────────────────────
UPDATE products p
SET sizes = (
    SELECT string_agg(DISTINCT pv.size, ',')
    FROM product_variants pv
    WHERE pv.product_id = p.id
      AND pv.size IS NOT NULL
      AND pv.size <> ''
      AND pv.size NOT LIKE '$%'
)
WHERE EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
);

COMMIT;
