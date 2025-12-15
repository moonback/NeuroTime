-- Ajouter la colonne pour le chronomètre
ALTER TABLE missions ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP WITH TIME ZONE;

