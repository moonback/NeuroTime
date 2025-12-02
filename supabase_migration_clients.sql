-- Migration SQL pour créer la table clients dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS (Row Level Security) pour la sécurité
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne peuvent voir que leurs propres clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent insérer que leurs propres clients
CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent mettre à jour que leurs propres clients
CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs ne peuvent supprimer que leurs propres clients
CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Créer un index sur name pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Index unique composite pour empêcher les doublons (insensible à la casse) par utilisateur
-- Cet index unique empêche également les doublons et améliore les performances des requêtes
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_name_unique ON clients(user_id, LOWER(name));

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

