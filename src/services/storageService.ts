import { Mission, Payment } from '../types';
import {
  saveMissionsToSupabase,
  loadMissionsFromSupabase,
  loadPaymentsFromSupabase,
  savePaymentToSupabase,
  deletePaymentFromSupabase
} from './supabaseService';

const STORAGE_VERSION = 'v2';

const getEnvironmentKey = (): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'local';
  return supabaseUrl.replace(/[^a-zA-Z0-9]/g, '_');
};

const getScopedStorageKey = (userId: string, namespace: 'missions' | 'payments') => (
  `NeuroTime_${getEnvironmentKey()}_${userId}_${namespace}_${STORAGE_VERSION}`
);

const isNetworkError = (error: unknown): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error || '');
  return errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('Failed to fetch');
};

const readJsonArray = <T,>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage`, error);
    return [];
  }
};

const writeJsonArray = <T,>(key: string, value: T[]): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Fonction de sauvegarde avec fallback sur localStorage scoped utilisateur
export const saveMissions = async (missions: Mission[], userId: string): Promise<void> => {
  const storageKey = getScopedStorageKey(userId, 'missions');

  // Toujours sauvegarder dans localStorage scoped d'abord pour garantir la persistance locale
  try {
    writeJsonArray(storageKey, missions);
  } catch (localError) {
    console.error('Failed to save missions to local storage', localError);
    throw new Error('Impossible de sauvegarder les données localement');
  }

};

/**
 * Résout les conflits entre missions locales et Supabase.
 * Supabase reste la source de vérité pour les lignes connues ; les lignes locales inconnues
 * sont conservées comme créations offline et ré-upsertées sans supprimer les lignes distantes.
 */
const resolveConflicts = (localMissions: Mission[], supabaseMissions: Mission[]): Mission[] => {
  const missionMap = new Map<string, Mission>();

  supabaseMissions.forEach(mission => {
    missionMap.set(mission.id, mission);
  });

  localMissions.forEach(localMission => {
    const supabaseMission = missionMap.get(localMission.id);

    if (supabaseMission) {
      const localUpdatedAt = localMission.updatedAt;
      const supabaseUpdatedAt = supabaseMission.updatedAt;

      if (localUpdatedAt && supabaseUpdatedAt && new Date(localUpdatedAt) > new Date(supabaseUpdatedAt)) {
        missionMap.set(localMission.id, localMission);
      }
    } else {
      missionMap.set(localMission.id, {
        ...localMission,
        updatedAt: localMission.updatedAt || new Date().toISOString(),
      });
    }
  });

  return Array.from(missionMap.values());
};

// Fonction de chargement avec fallback sur localStorage scoped utilisateur et résolution de conflits non destructive
export const loadMissions = async (userId: string): Promise<Mission[]> => {
  const storageKey = getScopedStorageKey(userId, 'missions');
  const localMissions = readJsonArray<Mission>(storageKey);

  try {
    const supabaseMissions = await loadMissionsFromSupabase();

    if (supabaseMissions.length > 0 || localMissions.length > 0) {
      const resolvedMissions = resolveConflicts(localMissions, supabaseMissions);
      writeJsonArray(storageKey, resolvedMissions);

      const missionsToPush = resolvedMissions.filter(mission => {
        const remoteMission = supabaseMissions.find(candidate => candidate.id === mission.id);
        if (!remoteMission) return true;
        if (!mission.updatedAt || !remoteMission.updatedAt) return false;
        return new Date(mission.updatedAt) > new Date(remoteMission.updatedAt);
      });

      if (missionsToPush.length > 0) {
        try {
          await saveMissionsToSupabase(missionsToPush);
        } catch (error) {
          console.warn('Impossible de sauvegarder les missions locales en attente dans Supabase:', error);
        }
      }

      return resolvedMissions;
    }
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('Erreur réseau lors du chargement Supabase, utilisation des données locales:', error);
    } else {
      console.error('Erreur lors du chargement depuis Supabase, utilisation du localStorage:', error);
    }
  }

  return localMissions;
};

// ==================== GESTION DES PAIEMENTS ====================

export const loadPayments = async (userId: string): Promise<Payment[]> => {
  const storageKey = getScopedStorageKey(userId, 'payments');
  const localPayments = readJsonArray<Payment>(storageKey);

  try {
    const supabasePayments = await loadPaymentsFromSupabase();
    if (supabasePayments.length > 0) {
      writeJsonArray(storageKey, supabasePayments);
      return supabasePayments;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paiements depuis Supabase:', error);
  }

  return localPayments;
};

export const savePayment = async (payment: Payment, userId: string): Promise<void> => {
  const storageKey = getScopedStorageKey(userId, 'payments');

  try {
    const current = readJsonArray<Payment>(storageKey);
    const exists = current.find(p => p.id === payment.id);
    const updated = exists
      ? current.map(p => p.id === payment.id ? payment : p)
      : [...current, payment];
    writeJsonArray(storageKey, updated);
  } catch (error) {
    console.error('Failed to save payment locally', error);
  }

  await savePaymentToSupabase(payment);
};

export const deletePayment = async (id: string, userId: string): Promise<void> => {
  const storageKey = getScopedStorageKey(userId, 'payments');

  try {
    const current = readJsonArray<Payment>(storageKey);
    const updated = current.filter(p => p.id !== id);
    writeJsonArray(storageKey, updated);
  } catch (error) {
    console.error('Failed to delete payment locally', error);
  }

  await deletePaymentFromSupabase(id);
};
