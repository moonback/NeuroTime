-- Migration pour ajouter le champ is_paid (suivi des missions payées)
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne is_paid (par défaut false pour les missions existantes)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

-- Créer un index pour améliorer les performances des requêtes filtrées par is_paid
CREATE INDEX IF NOT EXISTS idx_missions_is_paid ON missions(is_paid);

-- Index composite pour les requêtes utilisateur + statut + payé
CREATE INDEX IF NOT EXISTS idx_missions_user_status_paid ON missions(user_id, status, is_paid);

-- Note: Les missions existantes auront is_paid = false par défaut
-- Vous pouvez les mettre à jour manuellement si nécessaire

