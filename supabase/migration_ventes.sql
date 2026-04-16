-- ============================================================
-- MIGRATION : Tables saisie des ventes quotidiennes
-- Coller dans Supabase > SQL Editor > Run
-- ============================================================

-- Ajouter le type 'vente' aux mouvements de stock
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_type_check
  CHECK (type IN ('livraison', 'reassort', 'ajustement', 'perte', 'vente'));

-- Sessions de saisie des ventes
CREATE TABLE IF NOT EXISTS sales_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  service     TEXT NOT NULL DEFAULT 'soir' CHECK (service IN ('midi', 'soir', 'journee')),
  status      TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'confirme')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lignes de vente (une ligne par cocktail)
CREATE TABLE IF NOT EXISTS sales_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sales_sessions(id) ON DELETE CASCADE,
  cocktail_nom TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (session_id, cocktail_nom)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sales_sessions_date ON sales_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_lines_session ON sales_lines(session_id);

-- RLS
ALTER TABLE sales_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_lines    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_sessions_select" ON sales_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_sessions_insert" ON sales_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sales_sessions_update" ON sales_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sales_sessions_delete" ON sales_sessions FOR DELETE TO authenticated USING (get_my_role() IN ('manager','admin'));

CREATE POLICY "sales_lines_select" ON sales_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_lines_insert" ON sales_lines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sales_lines_update" ON sales_lines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "sales_lines_delete" ON sales_lines FOR DELETE TO authenticated USING (get_my_role() IN ('manager','admin'));
