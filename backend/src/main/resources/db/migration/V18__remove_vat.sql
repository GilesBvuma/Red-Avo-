-- V18: Remove VAT calculations

-- Set default VAT rate to 0.0 for new products
ALTER TABLE products ALTER COLUMN vat_rate SET DEFAULT 0.0;

-- Update existing products to have 0.0 VAT rate
UPDATE products SET vat_rate = 0.0;
