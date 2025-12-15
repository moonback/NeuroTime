import { getSupabase } from './authService';

export interface Goal {
  id: string;
  type: 'revenue' | 'missions' | 'hours';
  target: number;
  period: 'month' | 'year';
  createdAt?: string;
  updatedAt?: string;
}

// Obtenir l'ID de l'utilisateur connecté
const getCurrentUserId = async (): Promise<string | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Conversion entre camelCase (TypeScript) et snake_case (PostgreSQL)
const goalToDb = (goal: Goal, userId: string) => ({
  id: goal.id,
  user_id: userId,
  type: goal.type,
  target: goal.target,
  period: goal.period,
  created_at: goal.createdAt || new Date().toISOString(),
  updated_at: goal.updatedAt || new Date().toISOString(),
});

const dbToGoal = (dbRow: any): Goal => ({
  id: dbRow.id,
  type: dbRow.type,
  target: parseFloat(dbRow.target),
  period: dbRow.period,
  createdAt: dbRow.created_at,
  updatedAt: dbRow.updated_at,
});

// Charger tous les objectifs depuis Supabase
export const loadGoalsFromSupabase = async (): Promise<Goal[]> => {
  const supabase = getSupabase();
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
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      return [];
    }

    return (data || []).map(dbToGoal);
  } catch (error) {
    console.error('Erreur lors du chargement des objectifs depuis Supabase:', error);
    return [];
  }
};

// Sauvegarder un objectif (créer ou mettre à jour)
export const saveGoalToSupabase = async (goal: Goal): Promise<Goal> => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Impossible de se connecter à Supabase');
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  try {
    const goalDb = goalToDb(goal, userId);
    
    // Utiliser upsert pour créer ou mettre à jour
    const { data, error } = await supabase
      .from('goals')
      .upsert(goalDb, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      // Si c'est une erreur de contrainte unique (type + period), mettre à jour l'existant
      if (error.code === '23505') {
        // Récupérer l'objectif existant
        const { data: existing } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('type', goal.type)
          .eq('period', goal.period)
          .single();

        if (existing) {
          // Mettre à jour l'objectif existant
          const updatedGoal = { ...goal, id: existing.id };
          const updatedDb = goalToDb(updatedGoal, userId);
          
          const { data: updated, error: updateError } = await supabase
            .from('goals')
            .update(updatedDb)
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) {
            console.error('Erreur lors de la mise à jour de l\'objectif:', updateError);
            throw updateError;
          }

          return dbToGoal(updated);
        }
      }
      
      console.error('Erreur lors de la sauvegarde de l\'objectif:', error);
      throw error;
    }

    return dbToGoal(data);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'objectif dans Supabase:', error);
    throw error;
  }
};

// Supprimer un objectif
export const deleteGoalFromSupabase = async (goalId: string): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Impossible de se connecter à Supabase');
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'objectif:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'objectif dans Supabase:', error);
    throw error;
  }
};

// Sauvegarder plusieurs objectifs (synchronisation)
export const saveGoalsToSupabase = async (goals: Goal[]): Promise<void> => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Impossible de se connecter à Supabase');
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Utilisateur non connecté');
  }

  try {
    // Récupérer les IDs existants pour cet utilisateur
    const { data: existingData } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId);
    
    const existingIds = new Set((existingData || []).map(row => row.id));
    const goalIds = new Set(goals.map(g => g.id));

    // Supprimer les objectifs qui n'existent plus dans la nouvelle liste
    const idsToDelete = Array.from(existingIds).filter(id => !goalIds.has(id));
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('goals')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Erreur lors de la suppression des objectifs:', deleteError);
      }
    }

    // Utiliser upsert pour insérer ou mettre à jour les objectifs
    if (goals.length > 0) {
      const goalsDb = goals.map(g => goalToDb(g, userId));
      
      const { error: upsertError } = await supabase
        .from('goals')
        .upsert(goalsDb, { onConflict: 'id' });

      if (upsertError) {
        console.error('Erreur lors de la sauvegarde des objectifs:', upsertError);
        throw upsertError;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde dans Supabase:', error);
    throw error;
  }
};

