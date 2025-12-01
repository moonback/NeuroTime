-- Script SQL pour créer la table missions dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table missions
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client TEXT,
  location TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'completed', 'cancelled')),
  rate_type TEXT NOT NULL CHECK (rate_type IN ('day', 'night', 'mixed', 'custom')),
  hourly_rate NUMERIC(10, 2) DEFAULT 0,
  total_earnings NUMERIC(10, 2) DEFAULT 0,
  details JSONB,
  logistics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS (Row Level Security) pour la sécurité
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne peuvent voir que leurs propres missions
CREATE POLICY "Users can view own missions" ON missions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent insérer que leurs propres missions
CREATE POLICY "Users can insert own missions" ON missions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent mettre à jour que leurs propres missions
CREATE POLICY "Users can update own missions" ON missions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent supprimer que leurs propres missions
CREATE POLICY "Users can delete own missions" ON missions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);

-- Créer un index sur start_time pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_missions_start_time ON missions(start_time DESC);

-- Créer un index sur status pour filtrer rapidement
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);

-- Index composite pour les requêtes utilisateur + date
CREATE INDEX IF NOT EXISTS idx_missions_user_start_time ON missions(user_id, start_time DESC);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_missions_updated_at 
  BEFORE UPDATE ON missions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Note: Les noms de colonnes utilisent snake_case (start_time, end_time)
-- mais le code TypeScript utilise camelCase (startTime, endTime)
-- Le service Supabase gérera la conversion automatiquement

