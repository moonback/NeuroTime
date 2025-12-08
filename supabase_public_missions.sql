-- Script SQL pour permettre l'accès public aux missions terminées
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter une politique RLS pour permettre la lecture publique des missions terminées
-- Cette politique permet aux utilisateurs non authentifiés de voir uniquement les missions avec status = 'completed'
CREATE POLICY "Public can view completed missions" ON missions
  FOR SELECT
  USING (status = 'completed');

-- Note: Cette politique s'ajoute aux politiques existantes
-- Les utilisateurs authentifiés continueront de voir leurs propres missions grâce à la politique "Users can view own missions"
-- Les visiteurs non authentifiés verront uniquement les missions terminées de tous les utilisateurs

