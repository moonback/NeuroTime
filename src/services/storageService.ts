import { Mission, Payment } from '../types';
import {
  loadMissionsFromSupabase,
  loadPaymentsFromSupabase,
  savePaymentToSupabase,
  deletePaymentFromSupabase
} from './supabaseService';

const storageKey = (userId: string, namespace: string): string =>
  `neurotime:${import.meta.env.VITE_SUPABASE_URL}:user:${userId}:${namespace}:v2`;

export const clearLegacyStorage = (): void => {
  const legacyKeys = [
    'NeuroTime_missions_v1',
    'NeuroTime_payments_v1',
    'neurotime_clients_v1',
    'neurotime_preferences_v1',
  ];
  legacyKeys.forEach(k => localStorage.removeItem(k));
};

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

export const saveMissions = async (userId: string, missions: Mission[]): Promise<void> => {
  try {
    writeJsonArray(storageKey(userId, 'missions'), missions);
  } catch (localError) {
    console.error('Failed to save missions to local storage', localError);
    throw new Error('Impossible de sauvegarder les données localement');
  }
};

export const loadMissions = async (userId: string): Promise<Mission[]> => {
  const key = storageKey(userId, 'missions');
  const localMissions = readJsonArray<Mission>(key);

  const result = await loadMissionsFromSupabase();
  if (result.ok === true) {
    writeJsonArray(key, result.data);
    return result.data;
  }

  if (isNetworkError(result.error)) {
    console.warn('Erreur réseau lors du chargement Supabase, utilisation des données locales:', result.error);
  } else {
    console.error('Erreur lors du chargement depuis Supabase, utilisation du localStorage:', result.error);
  }
  return localMissions;
};

export const loadPayments = async (userId: string): Promise<Payment[]> => {
  const key = storageKey(userId, 'payments');
  const localPayments = readJsonArray<Payment>(key);

  const result = await loadPaymentsFromSupabase();
  if (result.ok === true) {
    writeJsonArray(key, result.data);
    return result.data;
  }

  console.error('Erreur lors du chargement des paiements depuis Supabase:', result.error);
  return localPayments;
};

export const savePayment = async (userId: string, payment: Payment): Promise<void> => {
  const key = storageKey(userId, 'payments');

  try {
    const current = readJsonArray<Payment>(key);
    const updated = current.some(p => p.id === payment.id)
      ? current.map(p => p.id === payment.id ? payment : p)
      : [...current, payment];
    writeJsonArray(key, updated);
  } catch (error) {
    console.error('Failed to save payment locally', error);
  }

  await savePaymentToSupabase(payment);
};

export const deletePayment = async (userId: string, id: string): Promise<void> => {
  const key = storageKey(userId, 'payments');

  try {
    const current = readJsonArray<Payment>(key);
    writeJsonArray(key, current.filter(p => p.id !== id));
  } catch (error) {
    console.error('Failed to delete payment locally', error);
  }

  await deletePaymentFromSupabase(id);
};
