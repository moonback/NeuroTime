import {
  loadClientsFromSupabase,
  addClientToSupabase,
  syncClientsWithMissionsInSupabase,
  Client
} from './supabaseService';
import { getSupabase } from './authService';

export type { Client };


const getCurrentUserId = async (): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

const getStorageKey = (userId: string): string =>
  `neurotime:${import.meta.env.VITE_SUPABASE_URL}:user:${userId}:clients:v2`;

// Charger les clients depuis le localStorage (fallback)
const loadClientsFromLocal = (userId: string | null): Client[] => {
  if (!userId) return [];
  const storageKey = getStorageKey(userId);
  try {
    const data = localStorage.getItem(storageKey);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des clients depuis localStorage:', error);
  }
  return [];
};

// Sauvegarder les clients dans le localStorage (fallback)
const saveClientsToLocal = (clients: Client[], userId: string | null): void => {
  if (!userId) return;
  const storageKey = getStorageKey(userId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(clients));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des clients dans localStorage:', error);
  }
};

// Extraire les clients uniques depuis les missions
export const extractClientsFromMissions = (missions: { client: string }[]): Client[] => {
  const clientNames = new Set<string>();
  
  missions.forEach(mission => {
    if (mission.client && mission.client.trim()) {
      clientNames.add(mission.client.trim());
    }
  });
  
  return Array.from(clientNames).map(name => ({
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString()
  }));
};

// Obtenir tous les clients (depuis Supabase avec fallback localStorage + extraction depuis missions)
export const getAllClients = async (missions: { client: string }[] = []): Promise<Client[]> => {
  const userId = await getCurrentUserId();

  // Essayer d'abord Supabase
  try {
    const supabaseClients = await loadClientsFromSupabase();
    if (supabaseClients.ok === false) {
      throw new Error(supabaseClients.error.message);
    }
    saveClientsToLocal(supabaseClients.data, userId);
    return [...supabaseClients.data].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      console.warn('Erreur réseau lors du chargement des clients depuis Supabase, utilisation du localStorage:', error);
    } else {
      console.error('Erreur lors du chargement des clients depuis Supabase:', error);
    }
  }
  
  // Fallback sur localStorage
  const localClients = loadClientsFromLocal(userId);
  const extractedClients = extractClientsFromMissions(missions);
  
  // Créer un Map pour éviter les doublons
  const clientsMap = new Map<string, Client>();
  
  // D'abord ajouter les clients stockés localement
  localClients.forEach(client => {
    clientsMap.set(client.name.toLowerCase(), client);
  });
  
  // Ensuite ajouter les clients extraits (sans écraser les existants)
  extractedClients.forEach(client => {
    const key = client.name.toLowerCase();
    if (!clientsMap.has(key)) {
      clientsMap.set(key, client);
    }
  });
  
  return Array.from(clientsMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  );
};

// Ajouter un nouveau client (Supabase avec fallback localStorage)
export const addClient = async (name: string): Promise<Client> => {
  const userId = await getCurrentUserId();
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Le nom du client ne peut pas être vide');
  }
  
  // Essayer d'abord Supabase
  try {
    const newClient = await addClientToSupabase(trimmedName);
    // Sauvegarder aussi dans localStorage pour le fallback
    const localClients = loadClientsFromLocal(userId);
    localClients.push(newClient);
    saveClientsToLocal(localClients, userId);
    return newClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      console.warn('Erreur réseau lors de l\'ajout du client dans Supabase, utilisation du localStorage:', error);
      // Fallback sur localStorage
      return addClientToLocal(trimmedName, userId);
    } else {
      // Si c'est une erreur de validation (client existe déjà), la propager
      throw error;
    }
  }
};

// Ajouter un client dans localStorage (fallback)
const addClientToLocal = (name: string, userId: string | null): Client => {
  const existingClients = loadClientsFromLocal(userId);
  
  // Vérifier si le client existe déjà (insensible à la casse)
  const exists = existingClients.some(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
  
  if (exists) {
    throw new Error('Ce client existe déjà');
  }
  
  const newClient: Client = {
    id: crypto.randomUUID(),
    name: name,
    createdAt: new Date().toISOString()
  };
  
  existingClients.push(newClient);
  saveClientsToLocal(existingClients, userId);
  
  return newClient;
};

// Synchroniser les clients avec les missions (ajouter les nouveaux clients trouvés dans les missions)
export const syncClientsWithMissions = async (missions: { client: string }[]): Promise<void> => {
  const userId = await getCurrentUserId();

  // Essayer d'abord Supabase
  try {
    await syncClientsWithMissionsInSupabase(missions);
    // Recharger les clients depuis Supabase pour mettre à jour le localStorage
    const supabaseClients = await loadClientsFromSupabase();
    if (supabaseClients.ok === false) {
      throw new Error(supabaseClients.error.message);
    }
    saveClientsToLocal(supabaseClients.data, userId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
      console.warn('Erreur réseau lors de la synchronisation des clients avec Supabase, utilisation du localStorage:', error);
      // Fallback sur localStorage
      syncClientsWithMissionsLocal(missions, userId);
    } else {
      console.error('Erreur lors de la synchronisation des clients avec les missions:', error);
      // Fallback sur localStorage en cas d'erreur
      syncClientsWithMissionsLocal(missions, userId);
    }
  }
};

// Synchroniser les clients avec les missions dans localStorage (fallback)
const syncClientsWithMissionsLocal = (missions: { client: string }[], userId: string | null): void => {
  const existingClients = loadClientsFromLocal(userId);
  const clientNames = new Set(existingClients.map(c => c.name.toLowerCase()));
  
  missions.forEach(mission => {
    if (mission.client && mission.client.trim()) {
      const clientName = mission.client.trim();
      if (!clientNames.has(clientName.toLowerCase())) {
        // Ajouter le nouveau client
        existingClients.push({
          id: crypto.randomUUID(),
          name: clientName,
          createdAt: new Date().toISOString()
        });
        clientNames.add(clientName.toLowerCase());
      }
    }
  });
  
  if (existingClients.length > loadClientsFromLocal(userId).length) {
    saveClientsToLocal(existingClients, userId);
  }
};

