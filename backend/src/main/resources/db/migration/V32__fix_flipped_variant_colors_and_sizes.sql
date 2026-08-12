-- Fix historical data where 'color' and 'size' were flipped due to Excel import assuming Option 1 is Color.
-- We only swap rows where the 'color' column contains a known size token.

UPDATE product_variants
SET 
    -- MySQL/Postgres handle SET a=b, b=a correctly in a single statement without losing data
    color = size,
    size = color
WHERE UPPER(TRIM(color)) IN (
    'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', 'XXXL', 
    'ONE SIZE', 'ONESIZE', 'STANDARD', 'FREE SIZE', 'FREESIZE'
);
