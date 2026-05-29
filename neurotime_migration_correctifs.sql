-- ============================================================
-- NEUROTIME — MIGRATION CORRECTIFS CRITIQUES
-- À exécuter dans Supabase SQL Editor
-- Date : 2026-05-29
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : Sécurité RLS — Supprimer la policy publique
-- ============================================================

-- ❌ DANGER : Supprime la lecture publique des missions terminées
DROP POLICY IF EXISTS "Public can view completed missions" ON missions;

-- ✅ S'assurer que les policies owner-only existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'missions' AND policyname = 'Users can view own missions'
  ) THEN
    CREATE POLICY "Users can view own missions" ON missions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'missions' AND policyname = 'Users can insert own missions'
  ) THEN
    CREATE POLICY "Users can insert own missions" ON missions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'missions' AND policyname = 'Users can update own missions'
  ) THEN
    CREATE POLICY "Users can update own missions" ON missions
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'missions' AND policyname = 'Users can delete own missions'
  ) THEN
    CREATE POLICY "Users can delete own missions" ON missions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 2 : Renforcement du schéma — user_id NOT NULL
-- ============================================================

-- Missions
ALTER TABLE missions ALTER COLUMN user_id SET NOT NULL;

-- Goals (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
    ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Clients (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 3 : Contrainte logique sur les dates de mission
-- ============================================================

ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS chk_missions_time_order;

ALTER TABLE missions
  ADD CONSTRAINT chk_missions_time_order
  CHECK (end_time > start_time);

-- ============================================================
-- ÉTAPE 4 : Migration table payments + payment_id
-- ============================================================

-- Colonne payment_id sur missions
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_id UUID;

-- Table payments
CREATE TABLE IF NOT EXISTS payments (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE          NOT NULL,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  client        TEXT          NOT NULL,
  description   TEXT,
  reference     TEXT,
  mission_ids   UUID[]        NOT NULL DEFAULT '{}',
  method        TEXT          NOT NULL CHECK (method IN ('virement', 'cash', 'check', 'other')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- RLS sur payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can manage own payments'
  ) THEN
    CREATE POLICY "Users can manage own payments" ON payments
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- FK entre missions.payment_id et payments.id
ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS fk_missions_payment_id;

ALTER TABLE missions
  ADD CONSTRAINT fk_missions_payment_id
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Indexes de performance
CREATE INDEX IF NOT EXISTS idx_payments_user_date    ON payments(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id      ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_payment_id   ON missions(payment_id) WHERE payment_id IS NOT NULL;

-- ============================================================
-- ÉTAPE 5 : Contrainte unique sur goals (user_id, type, period)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
    -- Supprimer d'éventuels doublons avant d'ajouter la contrainte
    DELETE FROM goals g1
    USING goals g2
    WHERE g1.id > g2.id
      AND g1.user_id = g2.user_id
      AND g1.type = g2.type
      AND g1.period = g2.period;

    -- Ajouter la contrainte unique
    ALTER TABLE goals
      DROP CONSTRAINT IF EXISTS goals_user_type_period_unique;
    ALTER TABLE goals
      ADD CONSTRAINT goals_user_type_period_unique
      UNIQUE (user_id, type, period);
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 6 : RPC transactionnelle pour save_payment_with_missions
-- ============================================================

CREATE OR REPLACE FUNCTION save_payment_with_missions(
  p_payment_id    UUID,
  p_user_id       UUID,
  p_date          DATE,
  p_amount        NUMERIC,
  p_client        TEXT,
  p_description   TEXT,
  p_reference     TEXT,
  p_mission_ids   UUID[],
  p_method        TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Vérification propriétaire
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé : user_id ne correspond pas à auth.uid()';
  END IF;

  -- Upsert du paiement
  INSERT INTO payments (id, user_id, date, amount, client, description, reference, mission_ids, method)
  VALUES (
    COALESCE(p_payment_id, gen_random_uuid()),
    p_user_id,
    p_date,
    p_amount,
    p_client,
    p_description,
    p_reference,
    p_mission_ids,
    p_method
  )
  ON CONFLICT (id) DO UPDATE SET
    amount      = EXCLUDED.amount,
    description = EXCLUDED.description,
    reference   = EXCLUDED.reference,
    mission_ids = EXCLUDED.mission_ids,
    updated_at  = now();

  -- Mise à jour atomique des missions associées
  UPDATE missions
  SET
    payment_id = COALESCE(p_payment_id, gen_random_uuid()),
    is_paid    = true,
    updated_at = now()
  WHERE
    user_id = p_user_id
    AND id  = ANY(p_mission_ids);
END;
$$;

-- ============================================================
-- ÉTAPE 7 : Trigger updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur missions
DROP TRIGGER IF EXISTS trigger_missions_updated_at ON missions;
CREATE TRIGGER trigger_missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appliquer sur payments
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VÉRIFICATIONS FINALES
-- ============================================================

-- Afficher toutes les policies actives sur missions
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'missions'
ORDER BY policyname;

-- Vérifier que payment_id existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'missions' AND column_name IN ('payment_id', 'is_paid', 'user_id')
ORDER BY column_name;

-- Vérifier que la table payments est créée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- Succès
SELECT 'Migration correctifs critiques NeuroTime — OK' AS status;
