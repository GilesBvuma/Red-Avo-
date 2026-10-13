ALTER TABLE categories ADD COLUMN display_order INT NOT NULL DEFAULT 0;

UPDATE categories SET display_order = CAST(id AS INTEGER);
