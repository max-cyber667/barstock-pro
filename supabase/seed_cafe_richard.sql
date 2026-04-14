-- ============================================================
-- SEED : Articles Café Richard
-- ============================================================

-- 1. Nouvelle catégorie
INSERT INTO categories (name, color) VALUES
  ('Café & Thé', '#92400e')
ON CONFLICT DO NOTHING;

-- 2. Articles Café Richard
WITH cats AS (SELECT id, name FROM categories)
INSERT INTO items (name, category_id, unit, unit_size, cost_per_unit, supplier, min_stock_bar, min_stock_reserve)
SELECT i.name, cats.id, i.unit, i.unit_size, i.cost, 'Café Richard', 0, 0
FROM (VALUES

  -- ── CAFÉS ───────────────────────────────────────────────
  ('Café Décaféiné Grains',            'Café & Thé', 'sachet',   500,   11.00,  NULL),
  ('Café Décaféiné Moulu',             'Café & Thé', 'sachet',   500,   11.00,  NULL),
  ('Café Décaféiné Moulu M03',         'Café & Thé', 'paquet',   500,   11.00,  NULL),
  ('Café Florio Grain',                'Café & Thé', 'kg',         1,   19.70,  NULL),
  ('Café Massaya Grain',               'Café & Thé', 'kg',         1,   19.70,  NULL),
  ('Café Pack Tradition',              'Café & Thé', 'carton',     1,   84.50,  NULL),
  ('Capsule Richard N1 Espresso',      'Café & Thé', 'boite',      1,    9.60,  NULL),
  ('Décaféiné Montparnasse MO2',       'Café & Thé', 'paquet',   500,   11.00,  NULL),

  -- ── CHOCOLAT & BOISSONS ─────────────────────────────────
  -- CARTON 6X1L → prix à la bouteille (÷6)
  ('Choco-O-Latte',                    'Café & Thé', 'bouteille', 100,   6.42,  NULL),
  ('Chocolat Gourmand Richard',        'Café & Thé', 'kg',          1,  11.26,  NULL),
  ('Chocolat Poudre',                  'Café & Thé', 'sachet',   1000,  10.00,  NULL),
  ('Prépa Lactée Choco Gourmand',      'Café & Thé', 'kg',          1,  11.26,  NULL),

  -- ── THÉS & INFUSIONS ────────────────────────────────────
  ('Infusion Menthe Verveine Bio',     'Café & Thé', 'boite',      1,   10.84,  NULL),
  ('Infusion Verveine Menthe',         'Café & Thé', 'boite',      1,    4.25,  NULL),
  ('Thé Grand Earl Grey',              'Café & Thé', 'boite',     40,   10.58,  NULL),
  ('Thé Parney Gold Breakfast',        'Café & Thé', 'boite',    100,    9.35,  NULL),
  ('Thé Vert Sencha',                  'Café & Thé', 'boite',     40,   10.58,  NULL),

  -- ── SUCRES & ACCOMPAGNEMENTS ────────────────────────────
  ('Canderel Buchette 0,5g',           'Café & Thé', 'colis',    450,   14.90,  NULL),
  ('Carré Noir Indiana Café 4G',       'Café & Thé', 'boite',    800,   13.20,  NULL),
  ('Sucre Indiana',                    'Café & Thé', 'carton',     1,   16.00,  NULL),

  -- ── VAISSELLE & ACCESSOIRES ─────────────────────────────
  ('Gobelet Cappuccino x50',           'Café & Thé', 'sac',        1,    2.70,  NULL),
  ('Gobelet Expresso Ristretto',       'Café & Thé', 'sac',        1,    2.90,  NULL),
  ('Couvercle Gobelet Cappuccino',     'Café & Thé', 'sac',        1,    4.75,  NULL),
  ('Couvercle Gobelet Ristretto',      'Café & Thé', 'sac',        1,    3.10,  NULL),
  ('Boite Agitateurs',                 'Café & Thé', 'boite',      1,    5.75,  NULL),
  ('Tasse à Café avec sous-tasses',    'Café & Thé', 'carton',     1,   28.40,  NULL),
  ('Tasse à Café Florio sans sous-tasses', 'Café & Thé', 'carton', 1,  34.60,  NULL),
  ('Tasse Cappuccino Florio',          'Café & Thé', 'carton',     1,   40.75,  NULL),

  -- ── ENTRETIEN ───────────────────────────────────────────
  ('Liquide Nettoyant Puly Milk',      'Café & Thé', 'bouteille',  1,   10.80,  NULL),
  ('Pastilles Détergentes Unic',       'Café & Thé', 'boite',      1,   33.10,  NULL),

  -- ── AUTRES ──────────────────────────────────────────────
  ('Blocs Notes Richard',              'Café & Thé', 'carton',     1,    0.00,  NULL)

) AS i(name, cat_name, unit, unit_size, cost, _ignored)
JOIN cats ON cats.name = i.cat_name;

-- 3. Créer les entrées de stock pour les nouveaux articles
INSERT INTO stock (item_id, location, quantity)
SELECT id, 'bar',     0 FROM items WHERE supplier = 'Café Richard'
  AND id NOT IN (SELECT item_id FROM stock WHERE location = 'bar')
UNION ALL
SELECT id, 'reserve', 0 FROM items WHERE supplier = 'Café Richard'
  AND id NOT IN (SELECT item_id FROM stock WHERE location = 'reserve');
