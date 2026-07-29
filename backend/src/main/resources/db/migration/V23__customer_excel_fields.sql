-- Add customer_code and first_visit_at to customers table for Excel import support
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_code VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_visit_at TIMESTAMP;
