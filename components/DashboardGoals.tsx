import React, { useState, useEffect, useMemo } from 'react';
import { Mission } from '../types';
import { Target, TrendingUp, Award, Edit2, X } from 'lucide-react';
import { format, isThisMonth, startOfMonth, endOfMonth } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { loadGoalsFromSupabase, saveGoalToSupabase, deleteGoalFromSupabase, saveGoalsToSupabase, Goal } from '../services/goalsService';

interface DashboardGoalsProps {
  missions: Mission[];
}

interface GoalWithProgress extends Goal {
  current: number;
  percentage: number;
  isCompleted: boolean;
}

const DashboardGoals: React.FC<DashboardGoalsProps> = ({ missions }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Charger les objectifs depuis Supabase
  useEffect(() => {
    const loadGoals = async () => {
      setIsLoading(true);
      try {
        const loadedGoals = await loadGoalsFromSupabase();
        if (loadedGoals.length > 0) {
          setGoals(loadedGoals);
        } else {
          // Objectifs par défaut si aucun objectif n'existe
          const defaultGoals: Goal[] = [
            { id: crypto.randomUUID(), type: 'revenue', target: 5000, period: 'month' },
            { id: crypto.randomUUID(), type: 'missions', target: 10, period: 'month' },
          ];
          setGoals(defaultGoals);
          // Sauvegarder les objectifs par défaut
          try {
            await saveGoalsToSupabase(defaultGoals);
          } catch (e) {
            console.error('Erreur lors de la sauvegarde des objectifs par défaut:', e);
          }
        }
      } catch (e) {
        console.error('Erreur lors du chargement des objectifs:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGoals();
  }, []);

  // Calculer les valeurs actuelles
  const goalsWithProgress = useMemo((): GoalWithProgress[] => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthMissions = missions.filter(m => {
      if (m.status === 'completed') {
        const missionDate = new Date(m.endTime);
        return missionDate >= monthStart && missionDate <= monthEnd;
      }
      return false;
    });

    const thisMonthRevenue = thisMonthMissions.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);
    const thisMonthHours = thisMonthMissions.reduce((sum, m) => {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);

    return goals.map(goal => {
      let current = 0;
      if (goal.period === 'month') {
        switch (goal.type) {
          case 'revenue':
            current = thisMonthRevenue;
            break;
          case 'missions':
            current = thisMonthMissions.length;
            break;
          case 'hours':
            current = thisMonthHours;
            break;
        }
      }
      
      return {
        ...goal,
        current: Math.round(current * 100) / 100,
        percentage: Math.min((current / goal.target) * 100, 100),
        isCompleted: current >= goal.target,
      };
    });
  }, [goals, missions]);

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
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'objectif:', error);
      alert('Erreur lors de la sauvegarde de l\'objectif. Veuillez réessayer.');
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
    if (!window.confirm('Supprimer cet objectif ?')) return;
    
    try {
      await deleteGoalFromSupabase(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'objectif:', error);
      alert('Erreur lors de la suppression de l\'objectif. Veuillez réessayer.');
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
            className={`p-4 rounded-xl border transition-all ${
              goal.isCompleted
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-dark-50 border-dark-200'
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
    </div>
  );
};

export default DashboardGoals;

