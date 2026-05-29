import { LoadResult, Mission, Payment, TimeSlot } from '../types';
import { getSupabase } from './authService';
import { retry } from '../utils/retry';

export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

type MissionDbRow = {
  id: string;
  user_id?: string | null;
  title: string;
  client: string;
  location: string;
  description: string;
  start_time: string;
  end_time: string;
  status: Mission['status'];
  rate_type: Mission['rateType'];
  hourly_rate: number;
  total_earnings: number;
  details?: Mission['details'] | null;
  logistics?: Mission['logistics'] | null;
  time_slots?: TimeSlot[] | null;
  is_paid?: boolean | null;
  updated_at?: string | null;
  payment_id?: string | null;
};

type PaymentDbRow = {
  id: string;
  date: string;
  amount: number;
  client: string;
  description?: string | null;
  reference?: string | null;
  mission_ids?: string[] | null;
  method?: Payment['method'] | null;
  created_at: string;
};

type ClientDbRow = {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
};

export const getSupabaseClient = () => getSupabase();

const missionToDb = (mission: Mission, userId: string): MissionDbRow => ({
  id: mission.id,
  user_id: userId,
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
  details: mission.details ?? null,
  updated_at: mission.updatedAt ?? new Date().toISOString(),
  is_paid: mission.isPaid ?? false,
  logistics: mission.logistics ?? null,
  time_slots: mission.timeSlots && mission.timeSlots.length > 1 ? mission.timeSlots : null,
  payment_id: mission.paymentId ?? null,
});

export const dbToMission = (dbRow: MissionDbRow): Mission => ({
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
  details: dbRow.details ?? undefined,
  logistics: dbRow.logistics ?? undefined,
  timeSlots: dbRow.time_slots ?? undefined,
  isPaid: dbRow.is_paid ?? false,
  updatedAt: dbRow.updated_at ?? undefined,
  paymentId: dbRow.payment_id ?? undefined,
});

const getCurrentUserId = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

export const saveMissionsToSupabase = async (missions: Mission[]): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  if (missions.length === 0) return;
  await retry(async () => {
    const { error } = await supabase
      .from('missions')
      .upsert(missions.map(m => missionToDb(m, userId)), { onConflict: 'id' });
    if (error) throw error;
  });
};

export const loadMissionsFromSupabase = async (): Promise<LoadResult<Mission[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: new Error('Supabase non configuré') };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { ok: false, error: authError };
  if (!user) return { ok: false, error: new Error('Non authentifié') };

  try {
    const { data, error } = await retry(async () => {
      const result = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });
      if (result.error) throw result.error;
      return result;
    });
    if (error) return { ok: false, error };
    return { ok: true, data: ((data ?? []) as MissionDbRow[]).map(dbToMission) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

export const saveMissionMutation = async (mission: Mission): Promise<Mission> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Utilisateur non connecté');

  const now = new Date().toISOString();
  const payload = missionToDb({ ...mission, updatedAt: now }, user.id);

  const { data, error } = await supabase
    .from('missions')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return dbToMission(data as MissionDbRow);
};

export const addMissionToSupabase = saveMissionMutation;
export const updateMissionInSupabase = saveMissionMutation;

export const deleteMissionMutation = async (missionId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Utilisateur non connecté');

  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', missionId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const deleteMissionFromSupabase = deleteMissionMutation;

const clientToDb = (client: Client, userId: string): ClientDbRow => ({
  id: client.id,
  user_id: userId,
  name: client.name,
  created_at: client.createdAt,
});

const dbToClient = (dbRow: ClientDbRow): Client => ({
  id: dbRow.id,
  name: dbRow.name,
  createdAt: dbRow.created_at,
});

export const loadClientsFromSupabase = async (): Promise<LoadResult<Client[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: new Error('Supabase non configuré') };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: new Error('Non authentifié') };

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) return { ok: false, error };
  return { ok: true, data: ((data ?? []) as ClientDbRow[]).map(dbToClient) };
};

export const addClientToSupabase = async (name: string): Promise<Client> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Impossible de se connecter à Supabase');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Le nom du client ne peut pas être vide');

  const { data: existing, error: existingError } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', trimmedName)
    .limit(1);

  if (existingError) throw existingError;
  if (existing && existing.length > 0) throw new Error('Ce client existe déjà');

  const newClient: Client = {
    id: crypto.randomUUID(),
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('clients')
    .insert([clientToDb(newClient, userId)])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Ce client existe déjà');
    throw error;
  }

  return dbToClient(data as ClientDbRow);
};

export const syncClientsWithMissionsInSupabase = async (missions: { client: string }[]): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  const { data: existingClients, error: loadError } = await supabase
    .from('clients')
    .select('name')
    .eq('user_id', userId);
  if (loadError) throw loadError;

  const existingNames = new Set(
    ((existingClients ?? []) as Pick<ClientDbRow, 'name'>[]).map(c => c.name.toLowerCase())
  );

  const clientsToAdd: ClientDbRow[] = [];
  new Set(missions.map(m => m.client.trim()).filter(Boolean)).forEach(name => {
    if (!existingNames.has(name.toLowerCase())) {
      clientsToAdd.push({
        id: crypto.randomUUID(),
        user_id: userId,
        name,
        created_at: new Date().toISOString(),
      });
    }
  });

  if (clientsToAdd.length === 0) return;
  const { error } = await supabase.from('clients').insert(clientsToAdd);
  if (error) throw error;
};

export const dbToPayment = (row: PaymentDbRow): Payment => ({
  id: row.id,
  date: row.date,
  amount: row.amount,
  client: row.client,
  description: row.description ?? undefined,
  reference: row.reference ?? undefined,
  missionIds: row.mission_ids ?? [],
  method: row.method ?? 'virement',
  createdAt: row.created_at,
});

export const loadPaymentsFromSupabase = async (): Promise<LoadResult<Payment[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: new Error('Supabase non configuré') };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: new Error('Non authentifié') };

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) return { ok: false, error };
  return { ok: true, data: ((data ?? []) as PaymentDbRow[]).map(dbToPayment) };
};

export const savePaymentToSupabase = async (payment: Payment): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Utilisateur non connecté');

  const { error } = await supabase.rpc('save_payment_with_missions', {
    p_payment_id: payment.id,
    p_user_id: user.id,
    p_date: payment.date,
    p_amount: payment.amount,
    p_client: payment.client,
    p_description: payment.description ?? '',
    p_reference: payment.reference ?? '',
    p_mission_ids: payment.missionIds,
    p_method: payment.method,
  });

  if (error) throw error;
};

export const deletePaymentFromSupabase = async (paymentId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

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
};
