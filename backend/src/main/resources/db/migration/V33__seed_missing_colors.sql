-- Insert missing colors into the colors table so product_variants can resolve their hex codes on the storefront.
-- ON CONFLICT DO UPDATE is safe because the 'colors' table has a UNIQUE constraint on the 'name' column.

INSERT INTO colors (name, hex_code) VALUES 
    ('Soft White', '#F5F5F5'),
    ('Matte Black', '#1C1C1C'),
    ('Cobalt blue', '#0047AB'),
    ('Cobalt Blue', '#0047AB'),
    ('Black PSR', '#1A1A1A'),
    ('Blue PSR', '#2A52BE'),
    ('Wine red PSR', '#722F37'),
    ('WineRed', '#722F37'),
    ('Black stripes', '#222222'),
    ('Grey stripes', '#808080'),
    ('Blue', '#3B82F6'),
    ('Orange', '#F97316'),
    ('Green', '#22C55E'),
    ('Bottle green', '#006A4E'),
    ('Dusty Mauve', '#B4909C'),
    ('Mustard', '#FFDB58'),
    ('Beige', '#F5F5DC'),
    ('Light grey', '#D3D3D3')
ON CONFLICT (name) DO UPDATE 
SET hex_code = EXCLUDED.hex_code;
