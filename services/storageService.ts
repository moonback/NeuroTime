import { Mission } from '../types';
import { 
  saveMissionsToSupabase, 
  loadMissionsFromSupabase 
} from './supabaseService';

const STORAGE_KEY = 'eventflow_missions_v1';

// Fonction de sauvegarde avec fallback sur localStorage
export const saveMissions = async (missions: Mission[]): Promise<void> => {
  try {
    // Essayer d'abord Supabase
    await saveMissionsToSupabase(missions);
    // Sauvegarder aussi dans localStorage comme backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde dans Supabase, utilisation du localStorage:', error);
    // Fallback sur localStorage en cas d'erreur
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
    } catch (localError) {
      console.error('Failed to save missions to local storage', localError);
    }
  }
};

// Fonction de chargement avec fallback sur localStorage
export const loadMissions = async (): Promise<Mission[]> => {
  try {
    // Essayer d'abord Supabase
    const missions = await loadMissionsFromSupabase();
    if (missions.length > 0) {
      // Synchroniser avec localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
      return missions;
    }
  } catch (error) {
    console.error('Erreur lors du chargement depuis Supabase, utilisation du localStorage:', error);
  }
  
  // Fallback sur localStorage
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load missions', error);
    return [];
  }
};