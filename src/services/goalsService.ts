import { LoadResult } from '../types';
import { getSupabase } from './authService';

export interface Goal {
  id: string;
  type: 'revenue' | 'missions' | 'hours';
  target: number;
  period: 'month' | 'year';
  createdAt?: string;
  updatedAt?: string;
}

type GoalDbRow = {
  id: string;
  user_id: string;
  type: Goal['type'];
  target: number | string;
  period: Goal['period'];
  created_at?: string | null;
  updated_at?: string | null;
};

const getCurrentUserId = async (): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

const goalToDb = (goal: Goal, userId: string) => ({
  id: goal.id,
  user_id: userId,
  type: goal.type,
  target: goal.target,
  period: goal.period,
  updated_at: new Date().toISOString(),
});

const dbToGoal = (dbRow: GoalDbRow): Goal => ({
  id: dbRow.id,
  type: dbRow.type,
  target: typeof dbRow.target === 'number' ? dbRow.target : parseFloat(dbRow.target),
  period: dbRow.period,
  createdAt: dbRow.created_at ?? undefined,
  updatedAt: dbRow.updated_at ?? undefined,
});

export const loadGoalsFromSupabase = async (): Promise<LoadResult<Goal[]>> => {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: new Error('Supabase non configuré') };

  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: new Error('Non authentifié') };

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) return { ok: false, error };
  return { ok: true, data: ((data ?? []) as GoalDbRow[]).map(dbToGoal) };
};

export const ensureDefaultGoals = async (): Promise<Goal[]> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Non authentifié');

  const defaults = [
    { user_id: user.id, type: 'revenue' as const, target: 5000, period: 'month' as const },
    { user_id: user.id, type: 'missions' as const, target: 10, period: 'month' as const },
  ];

  const { error } = await supabase
    .from('goals')
    .upsert(defaults, { onConflict: 'user_id,type,period', ignoreDuplicates: true });

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id);

  if (fetchError) throw fetchError;
  return ((data ?? []) as GoalDbRow[]).map(dbToGoal);
};

export const saveGoalToSupabase = async (goal: Goal): Promise<Goal> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Impossible de se connecter à Supabase');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  const { data, error } = await supabase
    .from('goals')
    .upsert(goalToDb(goal, userId), { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: existingError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('type', goal.type)
        .eq('period', goal.period)
        .single();
      if (existingError) throw existingError;
      const { data: updated, error: updateError } = await supabase
        .from('goals')
        .update(goalToDb({ ...goal, id: (existing as GoalDbRow).id }, userId))
        .eq('id', (existing as GoalDbRow).id)
        .select()
        .single();
      if (updateError) throw updateError;
      return dbToGoal(updated as GoalDbRow);
    }
    throw error;
  }

  return dbToGoal(data as GoalDbRow);
};

export const deleteGoalFromSupabase = async (goalId: string): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Impossible de se connecter à Supabase');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const saveGoalsToSupabase = async (goals: Goal[]): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Impossible de se connecter à Supabase');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  if (goals.length === 0) return;
  const { error } = await supabase
    .from('goals')
    .upsert(goals.map(g => goalToDb(g, userId)), { onConflict: 'id' });

  if (error) throw error;
};
