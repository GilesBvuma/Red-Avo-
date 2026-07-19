-- V17: Add product_supplier_invoices table for auditing

CREATE TABLE product_supplier_invoices (
    product_id BIGINT NOT NULL,
    invoice_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
