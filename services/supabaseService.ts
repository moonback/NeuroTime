import { createClient } from '@supabase/supabase-js';
import { Mission } from '../types';
import { getSupabase } from './authService';

// Initialisation du client Supabase (utilise le même client que l'auth)
const getSupabaseClient = () => {
  return getSupabase();
};

// Conversion entre camelCase (TypeScript) et snake_case (PostgreSQL)
const missionToDb = (mission: Mission, userId?: string) => ({
  id: mission.id,
  user_id: userId || null,
  title: mission.title,
  client: mission.client,
  location: mission.location,
  description: mission.description,
  start_time: mission.startTime,
  end_time: mission.endTime,
  status: mission.status,
  rate_type: mission.rateType,
  hourly_rate: mission.hourlyRate,
  total_earnings: mission.totalEarnings,
  details: mission.details,
  logistics: mission.logistics,
});

const dbToMission = (dbRow: any): Mission => ({
  id: dbRow.id,
  title: dbRow.title,
  client: dbRow.client,
  location: dbRow.location,
  description: dbRow.description,
  startTime: dbRow.start_time,
  endTime: dbRow.end_time,
  status: dbRow.status,
  rateType: dbRow.rate_type,
  hourlyRate: dbRow.hourly_rate,
  totalEarnings: dbRow.total_earnings,
  details: dbRow.details,
  logistics: dbRow.logistics,
});

// Obtenir l'ID de l'utilisateur connecté
const getCurrentUserId = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Sauvegarder toutes les missions (synchronise avec la base de données)
export const saveMissionsToSupabase = async (missions: Mission[]): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Impossible de se connecter à Supabase');
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('Utilisateur non connecté');
    return;
  }

  try {
    // Récupérer les IDs existants pour cet utilisateur
    const { data: existingData } = await supabase
      .from('missions')
      .select('id')
      .eq('user_id', userId);
    
    const existingIds = new Set((existingData || []).map(row => row.id));
    const missionIds = new Set(missions.map(m => m.id));

    // Supprimer les missions qui n'existent plus dans la nouvelle liste
    const idsToDelete = Array.from(existingIds).filter(id => !missionIds.has(id));
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('missions')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Erreur lors de la suppression des missions:', deleteError);
      }
    }

    // Utiliser upsert pour insérer ou mettre à jour les missions
    if (missions.length > 0) {
      const missionsDb = missions.map(m => missionToDb(m, userId));
      const { error: upsertError } = await supabase
        .from('missions')
        .upsert(missionsDb, { onConflict: 'id' });

      if (upsertError) {
        console.error('Erreur lors de la sauvegarde des missions:', upsertError);
        throw upsertError;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde dans Supabase:', error);
    throw error;
  }
};

// Charger toutes les missions
export const loadMissionsFromSupabase = async (): Promise<Mission[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Impossible de se connecter à Supabase');
    return [];
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('Utilisateur non connecté');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des missions:', error);
      return [];
    }

    return (data || []).map(dbToMission);
  } catch (error) {
    console.error('Erreur lors du chargement depuis Supabase:', error);
    return [];
  }
};

// Ajouter une mission
export const addMissionToSupabase = async (mission: Mission): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Impossible de se connecter à Supabase');
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('Utilisateur non connecté');
    return;
  }

  try {
    const missionDb = missionToDb(mission, userId);
    const { error } = await supabase
      .from('missions')
      .insert([missionDb]);

    if (error) {
      console.error('Erreur lors de l\'ajout de la mission:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout dans Supabase:', error);
    throw error;
  }
};

// Mettre à jour une mission
export const updateMissionInSupabase = async (mission: Mission): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Impossible de se connecter à Supabase');
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('Utilisateur non connecté');
    return;
  }

  try {
    const missionDb = missionToDb(mission, userId);
    const { error } = await supabase
      .from('missions')
      .update(missionDb)
      .eq('id', mission.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour dans Supabase:', error);
    throw error;
  }
};

// Supprimer une mission
export const deleteMissionFromSupabase = async (missionId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Impossible de se connecter à Supabase');
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('Utilisateur non connecté');
    return;
  }

  try {
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur lors de la suppression de la mission:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la suppression dans Supabase:', error);
    throw error;
  }
};

