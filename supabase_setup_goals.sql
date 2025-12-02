-- Script SQL pour créer la table goals (objectifs) dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'missions', 'hours')),
  target NUMERIC(10, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('month', 'year')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type, period) -- Un seul objectif par type et période par utilisateur
);

-- Activer RLS (Row Level Security) pour la sécurité
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne peuvent voir que leurs propres objectifs
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent insérer que leurs propres objectifs
CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent mettre à jour que leurs propres objectifs
CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent supprimer que leurs propres objectifs
CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Créer un index composite pour les requêtes utilisateur + type + période
CREATE INDEX IF NOT EXISTS idx_goals_user_type_period ON goals(user_id, type, period);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

