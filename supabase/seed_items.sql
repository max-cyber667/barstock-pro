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
  ('Angostura Bitters Siegert',        'Spiritueux', 'bouteille', 20,   16.53,  'Maison Riches Montes'),
  ('Aperol',                           'Spiritueux', 'bouteille', 100,  14.30,  NULL),
  ('Campari',                          'Spiritueux', 'bouteille', 100,  16.16,  NULL),
  ('Cachaca Sagatiba Pura',            'Spiritueux', 'bouteille', 70,   14.92,  NULL),
  ('Cinzano Blanc',                    'Spiritueux', 'bouteille', 100,   9.56,  NULL),
  ('Cinzano Rouge',                    'Spiritueux', 'bouteille', 100,   9.56,  NULL),
  ('Cognac Courvoisier VSOP',          'Spiritueux', 'bouteille', 70,   35.40,  NULL),
  ('Gin Beefeater',                    'Spiritueux', 'bouteille', 100,  20.43,  NULL),
  ('Gin Malfy Original Italie',        'Spiritueux', 'bouteille', 100,  35.97,  NULL),
  ('Jack Daniel''s',                   'Spiritueux', 'bouteille', 100,  27.97,  NULL),
  ('Kahlua Liqueur de Café',           'Spiritueux', 'bouteille', 100,  26.09,  NULL),
  ('Lillet Rosé 75CL',                 'Spiritueux', 'bouteille', 75,   12.51,  NULL),
  ('Limoncello Rama d''Oro 70CL',      'Spiritueux', 'bouteille', 70,   13.71,  NULL),
  ('Liqueur Bergamote Italicus',       'Spiritueux', 'bouteille', 70,   29.51,  NULL),
  ('Liqueur de Pêche Marie Brizard',   'Spiritueux', 'bouteille', 100,  13.84,  'Marie Brizard'),
  ('Liqueur Fleur de Sureau',          'Spiritueux', 'bouteille', 70,   10.80,  'Marie Brizard'),
  ('Malibu Coco',                      'Spiritueux', 'bouteille', 70,   15.46,  NULL),
  ('Picon Bière',                      'Spiritueux', 'bouteille', 100,  10.34,  NULL),
  ('Pippermint Get 27 Vert',           'Spiritueux', 'bouteille', 100,  15.16,  NULL),
  ('Rhum Ambré Havana Añejo',          'Spiritueux', 'bouteille', 100,  20.40,  NULL),
  ('Rhum Blanc Havana 3 Ans',          'Spiritueux', 'bouteille', 100,  19.43,  NULL),
  ('Rhum Brun Bumbu Original',         'Spiritueux', 'bouteille', 70,   41.27,  NULL),
  ('Rhum Diplomatico Reserva 40°',     'Spiritueux', 'bouteille', 70,   30.40,  NULL),
  ('Ricard 100CL',                     'Spiritueux', 'bouteille', 100,  17.03,  NULL),
  ('Sarti Rosa Italien 70CL',          'Spiritueux', 'bouteille', 70,   19.03,  NULL),
  ('Tequila Jose Cuervo',              'Spiritueux', 'bouteille', 70,   15.66,  NULL),
  ('Tequila Olmeca Altos Blanco',      'Spiritueux', 'bouteille', 100,  34.37,  NULL),
  ('Vodka Absolut Bleue',              'Spiritueux', 'bouteille', 100,  21.07,  NULL),
  ('Vodka Absolut Elyx',               'Spiritueux', 'bouteille', 70,   46.46,  NULL),
  ('Vodka Wyborowa Pologne',           'Spiritueux', 'bouteille', 70,   14.77,  NULL),
  ('Whisky Ballentines',               'Spiritueux', 'bouteille', 100,  18.61,  NULL),
  ('Whisky Buffalo Trace Bourbon',     'Spiritueux', 'bouteille', 70,   20.13,  NULL),
  ('Whisky Bushmill Original',         'Spiritueux', 'bouteille', 70,   17.35,  NULL),
  ('Whisky Chivas Regal 12 Ans',       'Spiritueux', 'bouteille', 70,   41.10,  NULL),

  -- ── VINS & BULLES ───────────────────────────────────────
  ('BIB Chardonnay 10L',               'Vins & Bulles', 'L', 1,  3.24,   'Colombard'),
  ('BIB Côte du Rhône 5L',             'Vins & Bulles', 'L', 1,  4.20,   'AC 3 Grappes'),
  ('Prosecco DOC Riccadonna',          'Vins & Bulles', 'bouteille', 75,  5.84,  NULL),
  ('Vin Argentin Malbec Alta Yari',    'Vins & Bulles', 'bouteille', 75,  7.98,  'Vin du Monde'),
  ('Vin Côtes de Provence AOC',        'Vins & Bulles', 'bouteille', 75, 10.14,  NULL),
  ('Vin IGP Pays d''OC Chardonnay',    'Vins & Bulles', 'bouteille', 75,  5.20,  NULL),
  ('Vin Lussac St Emilion',            'Vins & Bulles', 'bouteille', 75,  7.97,  NULL),
  ('Vin Petit Chablis AOC',            'Vins & Bulles', 'bouteille', 75,  9.48,  NULL),

  -- ── SIROPS ──────────────────────────────────────────────
  ('Sirop Chocolat Cookies Monin',     'Sirops', 'bouteille', 70,   6.30,  'Monin'),
  ('Sirop Citron',                     'Sirops', 'bouteille', 100,  3.38,  'Vernhes'),
  ('Sirop Orgeat Monin',               'Sirops', 'bouteille', 100,  6.10,  'Monin'),
  ('Sirop de Menthe',                  'Sirops', 'bouteille', 100,  3.38,  'Vernhes'),
  ('Sirop Pêche Blanche',              'Sirops', 'bouteille', 100,  4.85,  'Vernhes'),
  ('Sirop Falernum Monin',             'Sirops', 'bouteille', 70,   5.23,  'Monin'),
  ('Sirop Fraise',                     'Sirops', 'bouteille', 100,  4.41,  'Vernhes'),
  ('Sirop Grenadine',                  'Sirops', 'bouteille', 100,  3.38,  'Vernhes'),
  ('Sirop Sucre de Canne',             'Sirops', 'bouteille', 100,  3.52,  'Vernhes'),

  -- ── LIQUEURS & CRÈMES ───────────────────────────────────
  ('Crème de Cassis',                  'Liqueurs & Crèmes', 'bouteille', 100,  9.00,  'Marie Brizard'),
  ('Crème de Mûre 15°',               'Liqueurs & Crèmes', 'bouteille', 100,  9.00,  'Marie Brizard'),
  ('Curaçao Bleu',                     'Liqueurs & Crèmes', 'bouteille', 70,  10.32,  'Marie Brizard'),
  ('Curaçao Triple Sec',               'Liqueurs & Crèmes', 'bouteille', 70,  12.53,  'Marie Brizard'),

  -- ── JUS & NECTARS ───────────────────────────────────────
  -- Prix ramenés à la bouteille 1L (carton 6x1L ÷ 6)
  ('Jus d''Ananas',                    'Jus & Nectars', 'bouteille', 100,  2.71,  'Caraibos'),
  ('Jus d''Orange',                    'Jus & Nectars', 'bouteille', 100,  3.20,  'Caraibos'),
  ('Jus de Tomate',                    'Jus & Nectars', 'bouteille', 100,  2.42,  'Caraibos'),
  ('Jus de Pomme Trouble',             'Jus & Nectars', 'bouteille', 100,  3.07,  'Caraibos'),
  ('Nectar Citron Vert',               'Jus & Nectars', 'bouteille', 100,  2.42,  'Caraibos'),
  ('Nectar Cranberry',                 'Jus & Nectars', 'bouteille', 100,  2.90,  'Caraibos'),

  -- ── PURÉES & BASES ──────────────────────────────────────
  -- Carton = 6 bouteilles de 1kg → prix par bouteille = carton ÷ 6
  ('Crème de Noix de Coco',            'Purées & Bases', 'bouteille', 1,  12.76,  'Caraibos'),
  ('Island Oasis Ice Cream Base',      'Purées & Bases', 'bouteille', 1,  13.26,  'Da Vinci'),
  ('Purée Fruits Exotiques',           'Purées & Bases', 'bouteille', 1,   8.99,  'Oasis Islands'),
  ('Purée de Passion',                 'Purées & Bases', 'bouteille', 1,   8.35,  'Ravifruit'),
  ('Purée Margarita',                  'Purées & Bases', 'bouteille', 1,   9.30,  'Da Vinci'),
  ('Purée Mojito',                     'Purées & Bases', 'bouteille', 1,   5.32,  'Ravifruit'),
  ('Purée Summer Berries',             'Purées & Bases', 'bouteille', 1,   8.99,  'Oasis Islands'),
  ('Ravifruit Fraise',                 'Purées & Bases', 'bouteille', 1,   7.25,  'Ravifruit'),
  ('Smoothie Piña Colada',             'Purées & Bases', 'bouteille', 1,  11.05,  'Da Vinci'),

  -- ── MIXERS ──────────────────────────────────────────────
  ('Crodino Spritz 17,5CL',            'Mixers', 'unité', 1,  1.21,  NULL),
  ('Mix Maï Tai',                      'Mixers', 'bouteille', 100,  3.47,  'Caraibos'),
  ('Mix Planteur des Îles',            'Mixers', 'bouteille', 100,  3.17,  'Caraibos'),
  ('Mix Sex on the Beach',             'Mixers', 'bouteille', 100,  3.58,  'Caraibos'),

  -- ── EAUX & SOFT ─────────────────────────────────────────
  ('Cristalline 50CL',                 'Eaux & Soft', 'unité', 1,  0.50,  NULL)

) AS i(name, cat_name, unit, unit_size, cost, supplier)
JOIN cats ON cats.name = i.cat_name;

-- 3. Créer les entrées de stock (bar + réserve) pour tous les nouveaux articles
INSERT INTO stock (item_id, location, quantity)
SELECT id, 'bar',     0 FROM items
WHERE id NOT IN (SELECT item_id FROM stock WHERE location = 'bar')
UNION ALL
SELECT id, 'reserve', 0 FROM items
WHERE id NOT IN (SELECT item_id FROM stock WHERE location = 'reserve');
