-- ============================================================
-- MIGRATION : Tables inventaire mensuel
-- Coller dans Supabase > SQL Editor > Run
-- ============================================================

-- Sessions d'inventaire
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  location    TEXT NOT NULL DEFAULT 'bar' CHECK (location IN ('bar', 'reserve', 'les deux')),
  status      TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lignes d'inventaire (une ligne par article par emplacement)
CREATE TABLE IF NOT EXISTS inventory_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location    TEXT NOT NULL CHECK (location IN ('bar', 'reserve')),
  system_qty  DECIMAL(10,2) NOT NULL DEFAULT 0,
  counted_qty DECIMAL(10,2),
  UNIQUE (session_id, item_id, location)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_inv_lines_session ON inventory_lines(session_id);
CREATE INDEX IF NOT EXISTS idx_inv_sessions_date  ON inventory_sessions(date DESC);

-- RLS
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_lines    ENABLE ROW LEVEL SECURITY;

-- Sessions : manager/admin peuvent créer/modifier, tous peuvent lire
CREATE POLICY "inv_sessions_select" ON inventory_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_sessions_insert" ON inventory_sessions FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('manager','admin'));
CREATE POLICY "inv_sessions_update" ON inventory_sessions FOR UPDATE TO authenticated USING (get_my_role() IN ('manager','admin'));
CREATE POLICY "inv_sessions_delete" ON inventory_sessions FOR DELETE TO authenticated USING (get_my_role() = 'admin');

-- Lignes : tous peuvent lire et saisir
CREATE POLICY "inv_lines_select" ON inventory_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_lines_insert" ON inventory_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inv_lines_update" ON inventory_lines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "inv_lines_delete" ON inventory_lines FOR DELETE TO authenticated USING (get_my_role() IN ('manager','admin'));
