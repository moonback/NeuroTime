-- Migration de sécurité/synchronisation critique pour NeuroTime
-- À exécuter dans Supabase avant de déployer les corrections frontend.

-- 1) Ne jamais exposer publiquement les missions terminées.
DROP POLICY IF EXISTS "Public can view completed missions" ON missions;

-- 2) Renforcer l'ownership des tables principales.
-- Si des lignes legacy ont user_id NULL, rattachez-les manuellement avant ces ALTER.
ALTER TABLE missions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;

-- 3) Colonnes nécessaires au suivi des paiements côté missions.
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_id UUID;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_missions_user_payment ON missions(user_id, payment_id);
CREATE INDEX IF NOT EXISTS idx_missions_user_status_paid ON missions(user_id, status, is_paid);

-- 4) Table paiements alignée avec src/services/supabaseService.ts.
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  client TEXT NOT NULL,
  description TEXT,
  reference TEXT,
  mission_ids UUID[] NOT NULL DEFAULT '{}',
  method TEXT NOT NULL CHECK (method IN ('virement', 'cash', 'check', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments" ON payments
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_client ON payments(user_id, client);

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
