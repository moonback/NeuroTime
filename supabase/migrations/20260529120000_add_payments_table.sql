-- Migration : ajout de la table payments et de la colonne payment_id sur missions

-- 1. Colonne payment_id sur missions (si absente)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_id UUID;

-- 2. Contrainte logique : end_time > start_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_missions_time_order'
  ) THEN
    ALTER TABLE missions
      ADD CONSTRAINT chk_missions_time_order
      CHECK (end_time > start_time);
  END IF;
END $$;

-- 3. user_id NOT NULL sur toutes les tables owner-based
ALTER TABLE missions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;

-- 4. Table payments
CREATE TABLE IF NOT EXISTS payments (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE          NOT NULL,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  client      TEXT          NOT NULL,
  description TEXT,
  reference   TEXT,
  mission_ids UUID[]        NOT NULL DEFAULT '{}',
  method      TEXT          NOT NULL CHECK (method IN ('virement', 'cash', 'check', 'other')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 5. RLS sur payments
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

-- 6. FK entre missions.payment_id et payments.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_missions_payment_id'
  ) THEN
    ALTER TABLE missions
      ADD CONSTRAINT fk_missions_payment_id
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7. Trigger updated_at sur payments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Index de performance
CREATE INDEX IF NOT EXISTS idx_payments_user_date    ON payments(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_missions_user_payment ON missions(user_id, payment_id);

-- 9. Supprimer la policy publique dangereuse si elle existe
DROP POLICY IF EXISTS "Public can view completed missions" ON missions;

-- S'assurer qu'une policy SELECT owner-only existe pour missions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'missions' AND policyname = 'Users can view own missions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own missions" ON missions
      FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
