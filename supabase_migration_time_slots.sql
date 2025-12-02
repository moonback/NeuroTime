-- Migration pour ajouter les colonnes manquantes (logistics et time_slots)
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- si vous avez déjà une table missions existante

-- Ajouter la colonne logistics si elle n'existe pas
ALTER TABLE missions ADD COLUMN IF NOT EXISTS logistics JSONB;

-- Ajouter la colonne time_slots si elle n'existe pas
ALTER TABLE missions ADD COLUMN IF NOT EXISTS time_slots JSONB;

-- Commentaires sur les colonnes
COMMENT ON COLUMN missions.logistics IS 'Informations logistiques (livraison/récupération). Format: {"deliveryTime": "ISO String", "pickupTime": "ISO String"}';
COMMENT ON COLUMN missions.time_slots IS 'Tableau de créneaux horaires pour une même journée. Format: [{"startTime": "HH:mm", "endTime": "HH:mm"}]';

-- Note: Les missions existantes continueront de fonctionner avec start_time et end_time
-- Les nouvelles missions avec plusieurs créneaux utiliseront time_slots

