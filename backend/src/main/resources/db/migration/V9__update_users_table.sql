-- V5__update_users_table.sql

ALTER TABLE users 
ADD COLUMN full_name VARCHAR(255),
ADD COLUMN phone_number VARCHAR(50);

ALTER TABLE users DROP COLUMN IF EXISTS username;
