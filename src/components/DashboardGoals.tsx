import React, { useState, useEffect, useMemo } from 'react';
import { Mission } from '../types';
import { Target, TrendingUp, Award, Edit2, X } from 'lucide-react';
import { format, isThisMonth, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { loadGoalsFromSupabase, saveGoalToSupabase, deleteGoalFromSupabase, saveGoalsToSupabase, ensureDefaultGoals, Goal, dbToGoal } from '../services/goalsService';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../services/authService';

interface DashboardGoalsProps {
  missions: Mission[];
  selectedMonth?: Date;
}

interface GoalWithProgress extends Goal {
  current: number;
  percentage: number;
  isCompleted: boolean;
}

const DashboardGoals: React.FC<DashboardGoalsProps> = ({ missions, selectedMonth }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  // Charger les objectifs depuis Supabase
  useEffect(() => {
    const loadGoals = async () => {
      setIsLoading(true);
      try {
        const loadedGoals = await loadGoalsFromSupabase();
        if (loadedGoals.length > 0) {
          setGoals(loadedGoals);
        } else {
          // Aucun objectif existant, créer les objectifs par défaut de façon idempotente
          await ensureDefaultGoals();
          const refreshed = await loadGoalsFromSupabase();
          setGoals(refreshed);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des objectifs:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGoals();
  }, []);

  // Realtime subscription for goals
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`goals:user:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setGoals(current => current.filter(g => g.id !== deletedId));
            }
            return;
          }

          const remoteGoal = dbToGoal(payload.new);
          setGoals(current => {
            const existing = current.find(g => g.id === remoteGoal.id);
            if (!existing) return [...current, remoteGoal];
            return current.map(g => g.id === remoteGoal.id ? remoteGoal : g);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Calculer les valeurs actuelles pour le mois sélectionné (optimisé)
  const goalsWithProgress = useMemo((): GoalWithProgress[] => {
    if (goals.length === 0) return [];
    
    const referenceDate = selectedMonth || new Date();
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);
    
    // Convertir les dates limites en timestamps pour comparaisons plus rapides
    const monthStartTime = monthStart.getTime();
    const monthEndTime = monthEnd.getTime();

    // Filtrer et calculer en une seule passe pour optimiser les performances
    let thisMonthRevenue = 0;
    let thisMonthHours = 0;
    let thisMonthMissionsCount = 0;

    for (const m of missions) {
      if (m.status !== 'completed') continue;
      
      const missionEndTime = new Date(m.endTime).getTime();
      if (missionEndTime < monthStartTime || missionEndTime > monthEndTime) continue;
      
      thisMonthMissionsCount++;
      thisMonthRevenue += m.totalEarnings || 0;
      
      // Calcul d'heures plus précis
      const startTime = new Date(m.startTime).getTime();
      const endTime = missionEndTime;
      const hours = (endTime - startTime) / (1000 * 60 * 60);
      thisMonthHours += hours;
    }

    // Arrondir les valeurs pour éviter les erreurs de précision
    thisMonthRevenue = Math.round(thisMonthRevenue * 100) / 100;
    thisMonthHours = Math.round(thisMonthHours * 10) / 10;

    return goals.map(goal => {
      let current = 0;
      
      if (goal.period === 'month') {
        switch (goal.type) {
          case 'revenue':
            current = thisMonthRevenue;
            break;
          case 'missions':
            current = thisMonthMissionsCount;
            break;
          case 'hours':
            current = thisMonthHours;
            break;
        }
      }
      
      // Calcul du pourcentage avec protection contre division par zéro
      const percentage = goal.target > 0 
        ? Math.min((current / goal.target) * 100, 100) 
        : 0;
      
      return {
        ...goal,
        current: Math.round(current * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        isCompleted: current >= goal.target,
      };
    });
  }, [goals, missions, selectedMonth]);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal({ ...goal });
    setIsEditing(true);
  };

  const handleSaveGoal = async () => {
    if (!editingGoal) return;
    
    try {
      const savedGoal = await saveGoalToSupabase(editingGoal);
      
      // Mettre à jour la liste locale
      const existingIndex = goals.findIndex(g => g.id === savedGoal.id);
      if (existingIndex >= 0) {
        // Mise à jour
        setGoals(goals.map((g, i) => i === existingIndex ? savedGoal : g));
      } else {
        // Nouvel objectif
        setGoals([...goals, savedGoal]);
      }
      
      setIsEditing(false);
      setEditingGoal(null);
      toast.success('Objectif sauvegardé.');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'objectif:', error);
      toast.error('Erreur lors de la sauvegarde de l’objectif.');
    }
  };

  const handleAddGoal = () => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      type: 'revenue',
      target: 1000,
      period: 'month',
    };
    setEditingGoal(newGoal);
    setIsEditing(true);
  };

  const handleDeleteGoal = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer cet objectif ?',
      description: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      await deleteGoalFromSupabase(id);
      setGoals(goals.filter(g => g.id !== id));
      toast.success('Objectif supprimé.');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'objectif:', error);
      toast.error('Erreur lors de la suppression de l’objectif.');
    }
  };

  const getGoalLabel = (goal: Goal) => {
    const typeLabels = {
      revenue: 'CA mensuel',
      missions: 'Missions',
      hours: 'Heures',
    };
    return typeLabels[goal.type];
  };

  const getGoalUnit = (goal: Goal) => {
    const units = {
      revenue: '€',
      missions: '',
      hours: 'h',
    };
    return units[goal.type];
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-yellow-500/20 p-2 rounded-lg border border-yellow-500/30">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-100">Objectifs</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (goalsWithProgress.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-yellow-500/20 p-2 rounded-lg border border-yellow-500/30">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-100">Objectifs</h3>
          </div>
          <button
            onClick={handleAddGoal}
            className="text-xs px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg border border-primary-500/30 transition-all"
          >
            + Ajouter
          </button>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>Aucun objectif défini</p>
          <button
            onClick={handleAddGoal}
            className="mt-3 text-primary-300 hover:text-primary-200 text-sm font-medium"
          >
            Créer un objectif
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-yellow-500/20 p-2 rounded-lg border border-yellow-500/30">
            <Target className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">Objectifs</h3>
        </div>
        <button
          onClick={handleAddGoal}
          className="text-xs px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded-lg border border-primary-500/30 transition-all"
        >
          + Ajouter
        </button>
      </div>

      <div className="space-y-4">
        {goalsWithProgress.map((goal) => (
          <div
            key={goal.id}
            className={`p-4 rounded-xl border transition-all glass-light backdrop-blur-sm ${
              goal.isCompleted
                ? 'border-green-400/40 bg-green-500/10 shadow-soft'
                : 'border-gray-700/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {goal.isCompleted && <Award className="w-4 h-4 text-green-400" />}
                <h4 className="text-sm font-semibold text-gray-200">
                  {getGoalLabel(goal)} ({goal.period === 'month' ? 'Mois' : 'Année'})
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditGoal(goal)}
                  className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit2 size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <X size={14} className="text-red-400" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-lg font-bold text-gray-100">
                  {goal.current.toFixed(goal.type === 'revenue' ? 0 : 1)}{getGoalUnit(goal)}
                </p>
                <p className="text-xs text-gray-400">
                  sur {goal.target}{getGoalUnit(goal)} • {goal.percentage.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="h-2.5 bg-dark-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  goal.isCompleted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                }`}
                style={{ width: `${Math.min(goal.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'édition */}
      {isEditing && editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full animate-slide-in-up">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              {editingGoal.id && goals.find(g => g.id === editingGoal.id) ? 'Modifier' : 'Créer'} un objectif
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={editingGoal.type}
                  onChange={(e) => setEditingGoal({ ...editingGoal, type: e.target.value as 'revenue' | 'missions' | 'hours' })}
                  className="w-full glass-button px-4 py-2 rounded-lg"
                >
                  <option value="revenue">CA mensuel</option>
                  <option value="missions">Nombre de missions</option>
                  <option value="hours">Heures travaillées</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Objectif</label>
                <input
                  type="number"
                  value={editingGoal.target}
                  onChange={(e) => setEditingGoal({ ...editingGoal, target: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-button px-4 py-2 rounded-lg"
                  min="0"
                  step={editingGoal.type === 'revenue' ? '100' : '1'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Période</label>
                <select
                  value={editingGoal.period}
                  onChange={(e) => setEditingGoal({ ...editingGoal, period: e.target.value as 'month' | 'year' })}
                  className="w-full glass-button px-4 py-2 rounded-lg"
                >
                  <option value="month">Mensuel</option>
                  <option value="year">Annuel</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingGoal(null);
                }}
                className="flex-1 glass-button px-4 py-2 rounded-lg text-gray-300 hover:bg-dark-100 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                {editingGoal.id && goals.find(g => g.id === editingGoal.id) ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
};

export default DashboardGoals;

