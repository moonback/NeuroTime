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

/**
 * Résout les conflits entre missions locales et Supabase
 * Prend la version la plus récente basée sur updatedAt, ou startTime si updatedAt n'existe pas
 */
const resolveConflicts = (localMissions: Mission[], supabaseMissions: Mission[]): Mission[] => {
  const missionMap = new Map<string, Mission>();
  
  // Ajouter toutes les missions Supabase (source de vérité)
  supabaseMissions.forEach(mission => {
    missionMap.set(mission.id, mission);
  });
  
  // Vérifier les missions locales pour détecter les conflits
  localMissions.forEach(localMission => {
    const supabaseMission = missionMap.get(localMission.id);
    
    if (supabaseMission) {
      // Conflit détecté : comparer les dates de mise à jour
      const localUpdatedAt = localMission.updatedAt || localMission.startTime;
      const supabaseUpdatedAt = supabaseMission.updatedAt || supabaseMission.startTime;
      
      // Prendre la version la plus récente
      if (new Date(localUpdatedAt) > new Date(supabaseUpdatedAt)) {
        console.log(`Conflit résolu : version locale plus récente pour mission ${localMission.id}`);
        missionMap.set(localMission.id, localMission);
      } else {
        console.log(`Conflit résolu : version Supabase plus récente pour mission ${supabaseMission.id}`);
      }
    } else {
      // Mission locale qui n'existe pas dans Supabase : l'ajouter
      // (peut arriver si créée en mode offline)
      missionMap.set(localMission.id, localMission);
    }
  });
  
  return Array.from(missionMap.values());
};

// Fonction de chargement avec fallback sur localStorage et résolution de conflits
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
    
    if (supabaseMissions.length > 0 || localMissions.length > 0) {
      // Résoudre les conflits entre les deux sources
      const resolvedMissions = resolveConflicts(localMissions, supabaseMissions);
      
      // Synchroniser avec localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedMissions));
      
      // Si des conflits ont été résolus, sauvegarder la version résolue dans Supabase
      if (resolvedMissions.length > 0) {
        try {
          await saveMissionsToSupabase(resolvedMissions);
        } catch (error) {
          // Ne pas bloquer si la sauvegarde échoue, les données sont déjà dans localStorage
          console.warn('Impossible de sauvegarder les missions résolues dans Supabase:', error);
        }
      }
      
      return resolvedMissions;
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