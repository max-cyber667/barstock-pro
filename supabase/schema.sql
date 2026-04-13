-- BarStock Pro — Schema SQL complet
-- À exécuter dans Supabase SQL Editor

-- =============================
-- EXTENSIONS
-- =============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================
-- TABLES
-- =============================

-- Profils utilisateurs (liés à Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catégories
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Produits
CREATE TABLE IF NOT EXISTS items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  unit             TEXT NOT NULL DEFAULT 'CL',
  unit_size        DECIMAL(10,2) NOT NULL DEFAULT 1,
  cost_per_unit    DECIMAL(10,4) NOT NULL DEFAULT 0,
  supplier         TEXT,
  min_stock_bar    DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_reserve DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock (une ligne par produit par emplacement)
CREATE TABLE IF NOT EXISTS stock (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location   TEXT NOT NULL CHECK (location IN ('bar', 'reserve')),
  quantity   DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (item_id, location)
);

-- Mouvements (historique complet)
CREATE TABLE IF NOT EXISTS stock_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID REFERENCES items(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('livraison', 'reassort', 'ajustement', 'perte')),
  from_location TEXT,
  to_location   TEXT,
  quantity      DECIMAL(10,2) NOT NULL,
  direction     TEXT NOT NULL CHECK (direction IN ('in', 'out', 'transfer')),
  cost_at_time  DECIMAL(10,4),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bons de commande
CREATE TABLE IF NOT EXISTS purchase_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status      TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'envoyé', 'reçu')),
  notes       TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lignes des bons de commande
CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id           UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name         TEXT NOT NULL,
  suggested_qty     DECIMAL(10,2) NOT NULL DEFAULT 0,
  ordered_qty       DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_cost         DECIMAL(10,4) NOT NULL DEFAULT 0
);

-- =============================
-- INDEXES
-- =============================
CREATE INDEX IF NOT EXISTS idx_stock_item_location ON stock(item_id, location);
CREATE INDEX IF NOT EXISTS idx_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_user ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_order ON purchase_order_lines(order_id);

-- =============================
-- AUTO-UPDATE TIMESTAMP
-- =============================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_updated_at
  BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================
-- TRIGGER: créer profil à l'inscription
-- =============================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'staff'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================
-- HELPER: get current user role
-- =============================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================
-- ROW LEVEL SECURITY
-- =============================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- CATEGORIES
CREATE POLICY "categories_select" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert_manager" ON categories FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "categories_update_manager" ON categories FOR UPDATE TO authenticated USING (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- ITEMS
CREATE POLICY "items_select" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_insert_manager" ON items FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "items_update_manager" ON items FOR UPDATE TO authenticated USING (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "items_delete_admin" ON items FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- STOCK
CREATE POLICY "stock_select" ON stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_insert_manager" ON stock FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "stock_update_all" ON stock FOR UPDATE TO authenticated USING (true);

-- STOCK MOVEMENTS
CREATE POLICY "movements_select" ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "movements_insert" ON stock_movements FOR INSERT TO authenticated WITH CHECK (true);

-- PURCHASE ORDERS
CREATE POLICY "orders_select" ON purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_insert_manager" ON purchase_orders FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "orders_update_manager" ON purchase_orders FOR UPDATE TO authenticated USING (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "orders_delete_admin" ON purchase_orders FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- PURCHASE ORDER LINES
CREATE POLICY "order_lines_select" ON purchase_order_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "order_lines_insert_manager" ON purchase_order_lines FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "order_lines_update_manager" ON purchase_order_lines FOR UPDATE TO authenticated USING (get_my_role() IN ('manager', 'admin'));
CREATE POLICY "order_lines_delete_admin" ON purchase_order_lines FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- =============================
-- DONNÉES INITIALES (catégories)
-- =============================
INSERT INTO categories (name, color) VALUES
  ('Spiritueux', '#7c3aed'),
  ('Vins', '#dc2626'),
  ('Bières', '#d97706'),
  ('Softs', '#0891b2'),
  ('Sirops', '#059669'),
  ('Consommables', '#6b7280')
ON CONFLICT DO NOTHING;
