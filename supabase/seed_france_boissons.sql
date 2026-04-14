-- ============================================================
-- SEED : Articles France Boissons
-- ============================================================

-- 1. Nouvelles catégories
INSERT INTO categories (name, color) VALUES
  ('Bières',   '#f97316'),
  ('Sodas',    '#06b6d4')
ON CONFLICT DO NOTHING;

-- 2. Articles France Boissons
WITH cats AS (SELECT id, name FROM categories)
INSERT INTO items (name, category_id, unit, unit_size, cost_per_unit, supplier, min_stock_bar, min_stock_reserve)
SELECT i.name, cats.id, i.unit, i.unit_size, i.cost, 'France Boissons', 0, 0
FROM (VALUES

  -- ── BIÈRES ──────────────────────────────────────────────
  -- Fûts → tracké par fût
  ('Affligem Blonde 6°7 Fût 30L',      'Bières', 'fût',  30,   114.40,  NULL),
  ('Desperado 5°9 Fût 20L',            'Bières', 'fût',  20,    84.96,  NULL),
  ('Gallia Western IPA Fût 20L',       'Bières', 'fût',  20,    94.57,  NULL),
  -- Fûts → prix au litre
  ('Heineken 5° Fût 30L',              'Bières', 'L',     1,     3.22,  NULL),
  ('Indiana Mexican Lager',            'Bières', 'L',     1,     6.31,  NULL),
  ('Indiana Tropical IPA',             'Bières', 'L',     1,     6.35,  NULL),
  ('Desperados Sunlight',              'Bières', 'L',     1,     1.47,  NULL),
  -- Bouteilles (prix à la bouteille)
  ('Desperados 0% BTL',                'Bières', 'bouteille', 33,  1.39,  NULL),
  ('Mort Subite Kriek 4°',             'Bières', 'bouteille', 33,  1.82,  NULL),
  ('Mort Subite Witte 5°5',            'Bières', 'carton',    1,  20.37,  NULL),

  -- ── SODAS ───────────────────────────────────────────────
  -- BIBs → prix au litre
  ('BIB Coca-Cola 19L',                'Sodas', 'L', 1,  11.82,  NULL),
  ('BIB Fanta Orange 5L',              'Sodas', 'L', 1,  11.31,  NULL),
  ('BIB Finley Tonic 5L',              'Sodas', 'L', 1,  14.45,  NULL),
  ('BIB Fuzetea Pêche 5L',             'Sodas', 'L', 1,  16.13,  NULL),
  ('BIB Sprite 5L',                    'Sodas', 'L', 1,  10.74,  NULL),
  -- Canettes (prix à l''unité, carton ÷ 24)
  ('Canette Coca-Cola 33CL',           'Sodas', 'unité', 1,  0.74,  NULL),
  ('Canette Coca-Cola Zero 33CL',      'Sodas', 'unité', 1,  0.68,  NULL),
  ('Canette Perrier 33CL',             'Sodas', 'unité', 1,  0.71,  NULL),
  ('Cherry Coke VC 33CL',              'Sodas', 'unité', 1,  0.90,  NULL),
  ('Coca-Cola VC 33CL',                'Sodas', 'unité', 1,  0.86,  NULL),
  ('Coca-Cola Zero VC 33CL',           'Sodas', 'unité', 1,  0.77,  NULL),
  -- Bouteilles PET (prix à la bouteille)
  ('Pet Coca-Cola 1.5L',               'Sodas', 'bouteille', 150,  1.96,  NULL),
  ('Pet Cherry Coke 1.5L',             'Sodas', 'bouteille', 150,  3.19,  NULL),
  ('Pet Fanta 1.5L',                   'Sodas', 'bouteille', 150,  1.41,  NULL),
  ('Pet Sprite 1.5L',                  'Sodas', 'bouteille', 150,  3.53,  NULL),
  ('Fuzetea Pet 1.25L',                'Sodas', 'bouteille', 125,  2.56,  NULL),
  ('Sprite Pet 1.25L',                 'Sodas', 'bouteille', 125,  2.67,  NULL),
  -- Autres sodas
  ('Ginger Beer',                      'Sodas', 'bouteille', 33,   2.09,  NULL),
  ('Orangina BTL',                     'Sodas', 'bouteille', 25,   0.87,  NULL),
  ('Perrier 33CL VC',                  'Sodas', 'bouteille', 33,   0.83,  NULL),
  ('Pulco Citron 70CL',                'Sodas', 'bouteille', 70,   4.15,  NULL),
  ('Red Bull Regular 25CL',            'Sodas', 'unité',     1,    1.42,  NULL),
  ('Soda Pamplemousse La French',      'Sodas', 'L',         1,    1.96,  NULL),

  -- ── EAUX ────────────────────────────────────────────────
  ('Cristaline Pet 50CL',              'Eaux & Soft', 'unité', 1,  0.22,  NULL),
  ('Eau Acqua Pana 25CL',              'Eaux & Soft', 'bouteille', 25,  0.75,  NULL),
  ('Eau Acqua Pana 75CL',              'Eaux & Soft', 'bouteille', 75,  1.63,  NULL),
  ('Eau San Pellegrino 25CL',          'Eaux & Soft', 'bouteille', 25,  0.77,  NULL),
  ('Eau San Pellegrino Diamond 75CL',  'Eaux & Soft', 'bouteille', 75,  1.59,  NULL),

  -- ── VINS & BULLES ───────────────────────────────────────
  ('Champagne Jacquard',               'Vins & Bulles', 'bouteille', 75,  19.84,  NULL),
  ('Vin Côte de Provence La Gorge',    'Vins & Bulles', 'bouteille', 75,   6.62,  NULL),
  ('Vin Rouge Chinon Amaranthe',       'Vins & Bulles', 'bouteille', 75,   4.90,  NULL),

  -- ── AUTRES ──────────────────────────────────────────────
  ('Tube CO2 10KG',                    'Eaux & Soft', 'tube', 1,  41.99,  NULL)

) AS i(name, cat_name, unit, unit_size, cost, _ignored)
JOIN cats ON cats.name = i.cat_name;

-- 3. Créer les entrées de stock pour les nouveaux articles
INSERT INTO stock (item_id, location, quantity)
SELECT id, 'bar',     0 FROM items WHERE supplier = 'France Boissons'
  AND id NOT IN (SELECT item_id FROM stock WHERE location = 'bar')
UNION ALL
SELECT id, 'reserve', 0 FROM items WHERE supplier = 'France Boissons'
  AND id NOT IN (SELECT item_id FROM stock WHERE location = 'reserve');
