import { Mission } from '../types';
import { 
  saveMissionsToSupabase, 
  loadMissionsFromSupabase 
} from './supabaseService';

const STORAGE_KEY = 'eventflow_missions_v1';

// Fonction de sauvegarde avec fallback sur localStorage
export const saveMissions = async (missions: Mission[]): Promise<void> => {
  // Toujours sauvegarder dans localStorage d'abord pour garantir la persistance
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch (localError) {
    console.error('Failed to save missions to local storage', localError);
    throw new Error('Impossible de sauvegarder les données localement');
  }
  
  // Essayer ensuite Supabase (non bloquant)
  try {
    await saveMissionsToSupabase(missions);
  } catch (error: any) {
    // Ne pas faire échouer la sauvegarde si Supabase échoue
    const errorMessage = error?.message || 'Erreur inconnue';
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      console.warn('Erreur réseau lors de la sauvegarde Supabase, données sauvegardées localement:', error);
      // Les données sont déjà dans localStorage, on continue
    } else {
      console.error('Erreur lors de la sauvegarde dans Supabase:', error);
    }
  }
};

// Fonction de chargement avec fallback sur localStorage
export const loadMissions = async (): Promise<Mission[]> => {
  // Charger d'abord depuis localStorage pour un affichage immédiat
  let localMissions: Mission[] = [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    localMissions = data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load missions from localStorage', error);
  }
  
  // Essayer ensuite Supabase pour synchroniser
  try {
    const supabaseMissions = await loadMissionsFromSupabase();
    if (supabaseMissions.length > 0) {
      // Synchroniser avec localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(supabaseMissions));
      return supabaseMissions;
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Erreur inconnue';
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      console.warn('Erreur réseau lors du chargement Supabase, utilisation des données locales:', error);
    } else {
      console.error('Erreur lors du chargement depuis Supabase, utilisation du localStorage:', error);
    }
  }
  
  // Retourner les données locales si Supabase n'a pas fonctionné
  return localMissions;
};