-- ============================================================
-- SEED : Catégories + Articles + Stock (bar & réserve à 0)
-- Coller dans Supabase > SQL Editor > Run
-- ============================================================

-- 1. Catégories
INSERT INTO categories (name, color) VALUES
  ('Spiritueux',        '#f59e0b'),
  ('Vins & Bulles',     '#a855f7'),
  ('Sirops',            '#10b981'),
  ('Liqueurs & Crèmes', '#ec4899'),
  ('Jus & Nectars',     '#f97316'),
  ('Purées & Bases',    '#ef4444'),
  ('Mixers',            '#3b82f6'),
  ('Eaux & Soft',       '#6b7280');

-- 2. Articles
WITH cats AS (SELECT id, name FROM categories)
INSERT INTO items (name, category_id, unit, unit_size, cost_per_unit, supplier, min_stock_bar, min_stock_reserve)
SELECT i.name, cats.id, i.unit, i.unit_size, i.cost, i.supplier, 0, 0
FROM (VALUES

  -- ── SPIRITUEUX ──────────────────────────────────────────
  ('Angostura Bitters Siegert',        'Spiritueux', 'bouteille', 20,   16.53,  'Maison Richard'),
  ('Aperol',                           'Spiritueux', 'bouteille', 100,  14.30,  'Maison Richard'),
  ('Campari',                          'Spiritueux', 'bouteille', 100,  16.16,  'Maison Richard'),
  ('Cachaca Sagatiba Pura',            'Spiritueux', 'bouteille', 70,   14.92,  'Maison Richard'),
  ('Cinzano Blanc',                    'Spiritueux', 'bouteille', 100,   9.56,  'Maison Richard'),
  ('Cinzano Rouge',                    'Spiritueux', 'bouteille', 100,   9.56,  'Maison Richard'),
  ('Cognac Courvoisier VSOP',          'Spiritueux', 'bouteille', 70,   35.40,  'Maison Richard'),
  ('Gin Beefeater',                    'Spiritueux', 'bouteille', 100,  20.43,  'Maison Richard'),
  ('Gin Malfy Original Italie',        'Spiritueux', 'bouteille', 100,  35.97,  'Maison Richard'),
  ('Jack Daniel''s',                   'Spiritueux', 'bouteille', 100,  27.97,  'Maison Richard'),
  ('Kahlua Liqueur de Café',           'Spiritueux', 'bouteille', 100,  26.09,  'Maison Richard'),
  ('Lillet Rosé 75CL',                 'Spiritueux', 'bouteille', 75,   12.51,  'Maison Richard'),
  ('Limoncello Rama d''Oro 70CL',      'Spiritueux', 'bouteille', 70,   13.71,  'Maison Richard'),
  ('Liqueur Bergamote Italicus',       'Spiritueux', 'bouteille', 70,   29.51,  'Maison Richard'),
  ('Liqueur de Pêche Marie Brizard',   'Spiritueux', 'bouteille', 100,  13.84,  'Maison Richard'),
  ('Liqueur Fleur de Sureau',          'Spiritueux', 'bouteille', 70,   10.80,  'Maison Richard'),
  ('Malibu Coco',                      'Spiritueux', 'bouteille', 70,   15.46,  'Maison Richard'),
  ('Picon Bière',                      'Spiritueux', 'bouteille', 100,  10.34,  'Maison Richard'),
  ('Pippermint Get 27 Vert',           'Spiritueux', 'bouteille', 100,  15.16,  'Maison Richard'),
  ('Rhum Ambré Havana Añejo',          'Spiritueux', 'bouteille', 100,  20.40,  'Maison Richard'),
  ('Rhum Blanc Havana 3 Ans',          'Spiritueux', 'bouteille', 100,  19.43,  'Maison Richard'),
  ('Rhum Brun Bumbu Original',         'Spiritueux', 'bouteille', 70,   41.27,  'Maison Richard'),
  ('Rhum Diplomatico Reserva 40°',     'Spiritueux', 'bouteille', 70,   30.40,  'Maison Richard'),
  ('Ricard 100CL',                     'Spiritueux', 'bouteille', 100,  17.03,  'Maison Richard'),
  ('Sarti Rosa Italien 70CL',          'Spiritueux', 'bouteille', 70,   19.03,  'Maison Richard'),
  ('Tequila Jose Cuervo',              'Spiritueux', 'bouteille', 70,   15.66,  'Maison Richard'),
  ('Tequila Olmeca Altos Blanco',      'Spiritueux', 'bouteille', 100,  34.37,  'Maison Richard'),
  ('Vodka Absolut Bleue',              'Spiritueux', 'bouteille', 100,  21.07,  'Maison Richard'),
  ('Vodka Absolut Elyx',               'Spiritueux', 'bouteille', 70,   46.46,  'Maison Richard'),
  ('Vodka Wyborowa Pologne',           'Spiritueux', 'bouteille', 70,   14.77,  'Maison Richard'),
  ('Whisky Ballentines',               'Spiritueux', 'bouteille', 100,  18.61,  'Maison Richard'),
  ('Whisky Buffalo Trace Bourbon',     'Spiritueux', 'bouteille', 70,   20.13,  'Maison Richard'),
  ('Whisky Bushmill Original',         'Spiritueux', 'bouteille', 70,   17.35,  'Maison Richard'),
  ('Whisky Chivas Regal 12 Ans',       'Spiritueux', 'bouteille', 70,   41.10,  'Maison Richard'),

  -- ── VINS & BULLES ───────────────────────────────────────
  ('BIB Chardonnay 10L',               'Vins & Bulles', 'L', 1,  3.24,   'Maison Richard'),
  ('BIB Côte du Rhône 5L',             'Vins & Bulles', 'L', 1,  4.20,   'Maison Richard'),
  ('Prosecco DOC Riccadonna',          'Vins & Bulles', 'bouteille', 75,  5.84,  'Maison Richard'),
  ('Vin Argentin Malbec Alta Yari',    'Vins & Bulles', 'bouteille', 75,  7.98,  'Maison Richard'),
  ('Vin Côtes de Provence AOC',        'Vins & Bulles', 'bouteille', 75, 10.14,  'Maison Richard'),
  ('Vin IGP Pays d''OC Chardonnay',    'Vins & Bulles', 'bouteille', 75,  5.20,  'Maison Richard'),
  ('Vin Lussac St Emilion',            'Vins & Bulles', 'bouteille', 75,  7.97,  'Maison Richard'),
  ('Vin Petit Chablis AOC',            'Vins & Bulles', 'bouteille', 75,  9.48,  'Maison Richard'),

  -- ── SIROPS ──────────────────────────────────────────────
  ('Sirop Chocolat Cookies Monin',     'Sirops', 'bouteille', 70,   6.30,  'Maison Richard'),
  ('Sirop Citron',                     'Sirops', 'bouteille', 100,  3.38,  'Maison Richard'),
  ('Sirop Orgeat Monin',               'Sirops', 'bouteille', 100,  6.10,  'Maison Richard'),
  ('Sirop de Menthe',                  'Sirops', 'bouteille', 100,  3.38,  'Maison Richard'),
  ('Sirop Pêche Blanche',              'Sirops', 'bouteille', 100,  4.85,  'Maison Richard'),
  ('Sirop Falernum Monin',             'Sirops', 'bouteille', 70,   5.23,  'Maison Richard'),
  ('Sirop Fraise',                     'Sirops', 'bouteille', 100,  4.41,  'Maison Richard'),
  ('Sirop Grenadine',                  'Sirops', 'bouteille', 100,  3.38,  'Maison Richard'),
  ('Sirop Sucre de Canne',             'Sirops', 'bouteille', 100,  3.52,  'Maison Richard'),

  -- ── LIQUEURS & CRÈMES ───────────────────────────────────
  ('Crème de Cassis',                  'Liqueurs & Crèmes', 'bouteille', 100,  9.00,  'Maison Richard'),
  ('Crème de Mûre 15°',               'Liqueurs & Crèmes', 'bouteille', 100,  9.00,  'Maison Richard'),
  ('Curaçao Bleu',                     'Liqueurs & Crèmes', 'bouteille', 70,  10.32,  'Maison Richard'),
  ('Curaçao Triple Sec',               'Liqueurs & Crèmes', 'bouteille', 70,  12.53,  'Maison Richard'),

  -- ── JUS & NECTARS ───────────────────────────────────────
  ('Jus d''Ananas',                    'Jus & Nectars', 'bouteille', 100,  2.71,  'Maison Richard'),
  ('Jus d''Orange',                    'Jus & Nectars', 'bouteille', 100,  3.20,  'Maison Richard'),
  ('Jus de Tomate',                    'Jus & Nectars', 'bouteille', 100,  2.42,  'Maison Richard'),
  ('Jus de Pomme Trouble',             'Jus & Nectars', 'bouteille', 100,  3.07,  'Maison Richard'),
  ('Nectar Citron Vert',               'Jus & Nectars', 'bouteille', 100,  2.42,  'Maison Richard'),
  ('Nectar Cranberry',                 'Jus & Nectars', 'bouteille', 100,  2.90,  'Maison Richard'),

  -- ── PURÉES & BASES ──────────────────────────────────────
  ('Crème de Noix de Coco',            'Purées & Bases', 'bouteille', 1,  12.76,  'Maison Richard'),
  ('Island Oasis Ice Cream Base',      'Purées & Bases', 'bouteille', 1,  13.26,  'Maison Richard'),
  ('Purée Fruits Exotiques',           'Purées & Bases', 'bouteille', 1,   8.99,  'Maison Richard'),
  ('Purée de Passion',                 'Purées & Bases', 'bouteille', 1,   8.35,  'Maison Richard'),
  ('Purée Margarita',                  'Purées & Bases', 'bouteille', 1,   9.30,  'Maison Richard'),
  ('Purée Mojito',                     'Purées & Bases', 'bouteille', 1,   5.32,  'Maison Richard'),
  ('Purée Summer Berries',             'Purées & Bases', 'bouteille', 1,   8.99,  'Maison Richard'),
  ('Ravifruit Fraise',                 'Purées & Bases', 'bouteille', 1,   7.25,  'Maison Richard'),
  ('Smoothie Piña Colada',             'Purées & Bases', 'bouteille', 1,  11.05,  'Maison Richard'),

  -- ── MIXERS ──────────────────────────────────────────────
  ('Crodino Spritz 17,5CL',            'Mixers', 'unité', 1,  1.21,  'Maison Richard'),
  ('Mix Maï Tai',                      'Mixers', 'bouteille', 100,  3.47,  'Maison Richard'),
  ('Mix Planteur des Îles',            'Mixers', 'bouteille', 100,  3.17,  'Maison Richard'),
  ('Mix Sex on the Beach',             'Mixers', 'bouteille', 100,  3.58,  'Maison Richard'),

  -- ── EAUX & SOFT ─────────────────────────────────────────
  ('Cristalline 50CL',                 'Eaux & Soft', 'unité', 1,  0.50,  'Maison Richard')

) AS i(name, cat_name, unit, unit_size, cost, supplier)
JOIN cats ON cats.name = i.cat_name;

-- 3. Créer les entrées de stock (bar + réserve) pour tous les nouveaux articles
INSERT INTO stock (item_id, location, quantity)
SELECT id, 'bar',     0 FROM items
WHERE id NOT IN (SELECT item_id FROM stock WHERE location = 'bar')
UNION ALL
SELECT id, 'reserve', 0 FROM items
WHERE id NOT IN (SELECT item_id FROM stock WHERE location = 'reserve');
