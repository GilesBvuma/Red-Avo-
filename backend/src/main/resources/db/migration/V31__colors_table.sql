-- ─────────────────────────────────────────────────────────────────────────────
-- V31 — Colors table
-- Creates a reference table of product colors seeded with the full palette
-- used across the POS "Add Stock" form, replacing the previous hardcoded list.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS colors (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    hex_code   VARCHAR(7)   NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);

-- ── Core palette (original swatches, with edits applied) ─────────────────────
INSERT INTO colors (name, hex_code) VALUES
  ('Crimson Red',   '#C0392B'),
  ('Black',         '#1A1A1A'),
  ('Off White',     '#FAFAF5'),
  ('Blush Pink',    '#F4A0A0'),
  ('Forest Green',  '#2D6A4F'),
  ('Dark Blue',     '#1B3A6B'),
  ('Stone Grey',    '#9CA3AF'),
  ('Caramel',       '#C68642'),
  ('Lavender',      '#A78BFA'),
  ('Teal',          '#0D9488'),
  ('Burgundy',      '#800020'),
  ('Butter Yellow', '#F5C518'),
  ('Olive',         '#808000'),
  ('Charcoal',      '#36454F'),
  ('Peach',         '#FFE5B4'),
  ('Mint Green',    '#98FF98'),
  ('Coral',         '#FF7F50'),
  ('Lilac',         '#C8A2C8'),
  ('Cobalt',        '#0047AB'),
  ('Rose Gold',     '#B76E79'),
  ('Taupe',         '#483C32'),
  ('Brown',         '#7B3F00'),
  ('Plum',          '#8E4585'),
  ('Rust',          '#B7410E'),
  ('Sand',          '#C2B280'),
  ('Fuchsia',       '#FF10F0'),
  ('Bright Green',  '#39FF14'),
  ('Light Blue',    '#7DF9FF'),
  ('Red',           '#FF1010'),
-- ── Additional colors ────────────────────────────────────────────────────────
  ('Purple',        '#6B21A8'),
  ('Sage',          '#87A878'),
  ('Azure Blue',    '#007FFF'),
  ('Wine Red',      '#722F37'),
  ('Pistachio',     '#93C572'),
  ('Grey',          '#808080'),
  ('Cream',         '#FFFDD0'),
  ('Pink',          '#FFC0CB'),
  ('White',         '#FFFFFF'),
  ('Maroon',        '#800000'),
  ('Lime',          '#32CD32'),
  ('Teal Blue',     '#008B8B'),
  ('Mulberry',      '#C54B8C'),
  ('Sky Blue',      '#87CEEB'),
  ('Mauve',         '#E0B0FF'),
  ('Dusty Rose',    '#DCAE96'),
  ('Dark Brown',    '#4A2B0E'),
  ('Burnt Orange',  '#CC5500'),
  ('Khaki',         '#C3B091'),
  ('Navy Blue',     '#0D2B6E')
ON CONFLICT (name) DO NOTHING;
