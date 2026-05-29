import { Mission, Payment } from '../types';
import { getSupabase } from './authService';
import { retry } from '../utils/retry';

// Initialisation du client Supabase (utilise le même client que l'auth)
const getSupabaseClient = () => {
  return getSupabase();
};

// Conversion entre camelCase (TypeScript) et snake_case (PostgreSQL)
const missionToDb = (mission: Mission, userId?: string) => {
  const dbRow: any = {
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
  };

  if (mission.updatedAt !== undefined) {
    dbRow.updated_at = mission.updatedAt;
  }

  // Ajouter is_paid (par défaut false si non défini)
  if (mission.isPaid !== undefined) {
    dbRow.is_paid = mission.isPaid;
  }

  // Ajouter logistics seulement s'il existe (pour compatibilité avec anciennes bases)
  if (mission.logistics !== undefined) {
    dbRow.logistics = mission.logistics;
  }

  // Ajouter time_slots seulement s'il existe (pour compatibilité avec anciennes bases)
  if (mission.timeSlots !== undefined) {
    dbRow.time_slots = mission.timeSlots.length > 1 ? mission.timeSlots : null;
  }

  // Ajouter payment_id seulement s'il existe
  if (mission.paymentId !== undefined) {
    dbRow.payment_id = mission.paymentId;
  }

  return dbRow;
};

export const dbToMission = (dbRow: any): Mission => ({
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
  timeSlots: dbRow.time_slots || undefined, // Récupérer les créneaux horaires multiples
  isPaid: dbRow.is_paid || false, // Récupérer le statut de paiement (par défaut false)
  updatedAt: dbRow.updated_at || undefined, // Récupérer la date de mise à jour
  paymentId: dbRow.payment_id || undefined, // Récupérer l'ID du virement
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
    await retry(async () => {
      // Utiliser upsert pour insérer ou mettre à jour les missions
      if (missions.length > 0) {
        const missionsDb = missions.map(m => missionToDb(m, userId));

        // Filtrer les colonnes undefined pour éviter les erreurs si les colonnes n'existent pas encore
        const missionsDbFiltered = missionsDb.map(mission => {
          const filtered: any = {};
          Object.keys(mission).forEach(key => {
            if (mission[key] !== undefined) {
              filtered[key] = mission[key];
            }
          });
          return filtered;
        });

        const { error: upsertError } = await supabase
          .from('missions')
          .upsert(missionsDbFiltered, { onConflict: 'id' });

        if (upsertError) {
          throw upsertError;
        }
      }
    });
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
    const { data, error } = await retry(async () => {
      const result = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (result.error) {
        throw result.error;
      }

      return result;
    });

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
    await retry(async () => {
      const missionDb = missionToDb(mission, userId);
      const { error } = await supabase
        .from('missions')
        .upsert(missionDb, { onConflict: 'id' });

      if (error) {
        throw error;
      }
    });
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
    await retry(async () => {
      const missionDb = missionToDb(mission, userId);
      const { error } = await supabase
        .from('missions')
        .update(missionDb)
        .eq('id', mission.id)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    });
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
    await retry(async () => {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', missionId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression dans Supabase:', error);
    throw error;
  }
};

// ==================== GESTION DES CLIENTS ====================

export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

// Conversion entre camelCase (TypeScript) et snake_case (PostgreSQL) pour les clients
const clientToDb = (client: Client, userId: string) => ({
  id: client.id,
  user_id: userId,
  name: client.name,
  created_at: client.createdAt,
});

const dbToClient = (dbRow: any): Client => ({
  id: dbRow.id,
  name: dbRow.name,
  createdAt: dbRow.created_at,
});

// Charger tous les clients depuis Supabase
export const loadClientsFromSupabase = async (): Promise<Client[]> => {
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
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur lors du chargement des clients:', error);
      return [];
    }

    return (data || []).map(dbToClient);
  } catch (error) {
    console.error('Erreur lors du chargement des clients depuis Supabase:', error);
    return [];
  }
};

// Ajouter un client dans Supabase
export const addClientToSupabase = async (name: string): Promise<Client> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Impossible de se connecter à Supabase');
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Le nom du client ne peut pas être vide');
  }

  try {
    // Vérifier si le client existe déjà (insensible à la casse)
    const { data: existing } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', trimmedName)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error('Ce client existe déjà');
    }

    const newClient: Client = {
      id: crypto.randomUUID(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    const clientDb = clientToDb(newClient, userId);
    const { data, error } = await supabase
      .from('clients')
      .insert([clientDb])
      .select()
      .single();

    if (error) {
      // Si c'est une erreur de contrainte unique, c'est un doublon
      if (error.code === '23505') {
        throw new Error('Ce client existe déjà');
      }
      console.error('Erreur lors de l\'ajout du client:', error);
      throw error;
    }

    return dbToClient(data);
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout du client dans Supabase:', error);
    throw error;
  }
};

// Synchroniser les clients avec les missions (ajouter les clients trouvés dans les missions)
export const syncClientsWithMissionsInSupabase = async (missions: { client: string }[]): Promise<void> => {
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
    // Récupérer les clients existants
    const { data: existingClients } = await supabase
      .from('clients')
      .select('name')
      .eq('user_id', userId);

    const existingNames = new Set(
      (existingClients || []).map(c => c.name.toLowerCase())
    );

    // Extraire les noms de clients uniques des missions
    const clientNames = new Set<string>();
    missions.forEach(mission => {
      if (mission.client && mission.client.trim()) {
        clientNames.add(mission.client.trim());
      }
    });

    // Ajouter les nouveaux clients
    const clientsToAdd: any[] = [];
    clientNames.forEach(name => {
      if (!existingNames.has(name.toLowerCase())) {
        clientsToAdd.push({
          id: crypto.randomUUID(),
          user_id: userId,
          name: name,
          created_at: new Date().toISOString(),
        });
      }
    });

    if (clientsToAdd.length > 0) {
      const { error } = await supabase
        .from('clients')
        .insert(clientsToAdd);

      if (error) {
        console.error('Erreur lors de la synchronisation des clients:', error);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des clients avec les missions:', error);
  }
};

// ==================== GESTION DES PAIEMENTS / VIREMENTS ====================


export const dbToPayment = (row: any): Payment => ({
  id: row.id,
  date: row.date,
  amount: row.amount,
  client: row.client,
  description: row.description,
  reference: row.reference,
  missionIds: row.mission_ids || [],
  method: row.method || 'virement',
  createdAt: row.created_at,
});

export const loadPaymentsFromSupabase = async (): Promise<Payment[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      return [];
    }

    return (data || []).map(dbToPayment);
  } catch (error) {
    console.error('Erreur lors du chargement des paiements depuis Supabase:', error);
    return [];
  }
};

export const savePaymentToSupabase = async (payment: Payment): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const paymentDb = {
    id: payment.id,
    user_id: userId,
    date: payment.date,
    amount: payment.amount,
    client: payment.client,
    description: payment.description,
    reference: payment.reference,
    mission_ids: payment.missionIds,
    method: payment.method,
    created_at: payment.createdAt,
  };

  try {
    const { error: rpcError } = await supabase.rpc('save_payment_with_missions', {
      payment_payload: payment,
    });

    if (rpcError) throw rpcError;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du paiement:', error);
    throw error;
  }
};

export const deletePaymentFromSupabase = async (paymentId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    // Retirer le paymentId des missions associées avant de supprimer le paiement
    const { error: updateError } = await supabase
      .from('missions')
      .update({ payment_id: null, is_paid: false, updated_at: new Date().toISOString() })
      .eq('payment_id', paymentId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    throw error;
  }
};


