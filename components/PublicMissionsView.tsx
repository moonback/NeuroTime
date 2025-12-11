import React, { useState, useEffect, useMemo } from 'react';
import { Mission } from '../types';
import { loadPublicCompletedMissions } from '../services/supabaseService';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Calendar, Clock, Briefcase, MapPin, Euro, LogIn, CheckCircle, Sparkles, Filter } from 'lucide-react';
import { formatTimeSlots, getMissionTimeSlots } from '../utils/timeSlots';
import { LoadingSpinner } from './LoadingSpinner';

interface PublicMissionsViewProps {
  onLoginClick: () => void;
}

type PeriodType = 'all' | 'month' | 'quarter' | 'year' | 'custom';

const PublicMissionsView: React.FC<PublicMissionsViewProps> = ({ onLoginClick }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Calculer les dates selon la période choisie
  const periodDates = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (periodType) {
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'quarter':
        // Calculer le début et la fin du trimestre actuel
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
        }
        break;
      default:
        // 'all' - pas de filtre de date
        break;
    }

    return {
      start: start ? start.toISOString() : undefined,
      end: end ? end.toISOString() : undefined,
    };
  }, [periodType, customStartDate, customEndDate]);

  useEffect(() => {
    const loadMissions = async () => {
      try {
        setLoading(true);
        const data = await loadPublicCompletedMissions(periodDates.start, periodDates.end);
        setMissions(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des missions:', err);
        setError('Impossible de charger les missions. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    loadMissions();
  }, [periodDates.start, periodDates.end]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <LoadingSpinner fullScreen text="Chargement des missions..." />
      </div>
    );
  }

  const totalRevenue = missions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
  const totalHours = missions.reduce((acc, m) => {
    const d = (m.details?.dayHours || 0) + (m.details?.nightHours || 0);
    return acc + d;
  }, 0);
  const averageHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

  return (
    <div className="min-h-screen neo-aurora relative overflow-hidden">
      <div className="aurora-layer">
        <div className="aurora-blob primary" style={{ top: '-10%', left: '-10%' }} />
        <div className="aurora-blob pink" style={{ top: '20%', right: '-10%' }} />
        <div className="aurora-blob teal small" style={{ bottom: '-10%', left: '20%' }} />
      </div>

      {/* Header */}
      <div className="glass-strong border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-500/20 rounded-xl border border-primary-500/30">
                <Sparkles size={24} className="text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-100">NeuroTime</h1>
                <p className="text-xs md:text-sm text-gray-400 mt-1">Missions terminées</p>
              </div>
            </div>
            <button
              onClick={onLoginClick}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-500/25 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95 glow-primary"
            >
              <LogIn size={18} />
              <span>Se connecter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
        <div className="glass-card rounded-2xl p-2 md:p-3 border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 px-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
               <Filter size={18} className="text-primary-400" />
            </div>
            <span className="text-sm font-bold text-gray-200">Période</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-dark-900/30 rounded-xl">
            {(['all', 'month', 'quarter', 'year', 'custom'] as PeriodType[]).map((period) => (
              <button
                key={period}
                onClick={() => {
                  setPeriodType(period);
                  if (period === 'custom') {
                    setShowCustomDates(true);
                  } else {
                    setShowCustomDates(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  periodType === period
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {period === 'all' ? 'Tout' : 
                 period === 'month' ? 'Ce mois' :
                 period === 'quarter' ? 'Ce trimestre' :
                 period === 'year' ? 'Cette année' : 'Personnalisé'}
              </button>
            ))}
          </div>

          {showCustomDates && (
            <div className="flex items-center gap-2 animate-fade-in bg-dark-900/30 p-1.5 rounded-xl">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-xs text-gray-200 focus:border-primary-500/50 outline-none"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-xs text-gray-200 focus:border-primary-500/50 outline-none"
              />
            </div>
          )}
          
          {periodType !== 'all' && periodDates.start && periodDates.end && (
            <div className="hidden md:block px-4 py-2 bg-primary-500/10 rounded-xl border border-primary-500/20">
               <span className="text-xs font-medium text-primary-300">
                {format(new Date(periodDates.start), 'd MMM', { locale: fr })} - {format(new Date(periodDates.end), 'd MMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {missions.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="glass-card rounded-2xl p-5 border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <CheckCircle size={80} className="text-green-400" />
               </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/10 rounded-xl border border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.15)]">
                  <CheckCircle size={24} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Missions</p>
                  <p className="text-3xl font-black text-white">{missions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-5 border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Euro size={80} className="text-emerald-400" />
               </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                  <Euro size={24} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Revenus</p>
                  <p className="text-3xl font-black text-emerald-400 drop-shadow-sm">{totalRevenue.toFixed(0)}€</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Clock size={80} className="text-primary-400" />
               </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-gradient-to-br from-primary-400/20 to-primary-600/10 rounded-xl border border-primary-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <Clock size={24} className="text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Heures</p>
                  <p className="text-3xl font-black text-white">{totalHours.toFixed(0)}h</p>
                </div>
              </div>
            </div>
            
            {totalHours > 0 && (
              <div className="md:col-span-3 glass-card rounded-2xl p-4 border-white/5 flex items-center justify-between gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Euro size={16} className="text-blue-400" />
                  </div>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tarif horaire moyen</p>
                </div>
                 <p className="text-xl font-bold text-blue-300">{averageHourlyRate.toFixed(2)}€/h</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Missions List */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12 relative z-10">
        {error ? (
          <div className="glass-card rounded-2xl p-8 text-center border-red-500/20 bg-red-500/5">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        ) : missions.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center border-white/5 bg-white/[0.02]">
            <div className="flex flex-col items-center gap-6">
              <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border border-white/10 shadow-2xl shadow-black/50">
                <Calendar size={48} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-200 mb-2">Aucune mission terminée</h3>
                <p className="text-gray-500 max-w-md mx-auto">Il n'y a pas de missions terminées pour la période sélectionnée.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map((mission, index) => {
              const missionDate = new Date(mission.startTime);
              const timeSlots = getMissionTimeSlots(mission);
              
              return (
                <div
                  key={mission.id}
                  className="glass-card rounded-2xl p-5 border-white/5 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* Left side - Mission details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between md:justify-start gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-bold text-gray-100 group-hover:text-primary-300 transition-colors">{mission.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                             <Briefcase size={14} className="text-gray-600" />
                             <span className="font-medium text-gray-300">{mission.client}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 md:hidden">
                           <span className="text-lg font-black text-emerald-400">{mission.totalEarnings?.toFixed(0)}€</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-white/5 rounded-md">
                            <Calendar size={14} className="text-primary-400" />
                          </div>
                          <span className="font-medium text-gray-300">
                            {format(missionDate, 'EEEE d MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2.5">
                           <div className="p-1.5 bg-white/5 rounded-md">
                            <Clock size={14} className="text-orange-400" />
                          </div>
                          <span>{formatTimeSlots(mission)}</span>
                          {timeSlots.length > 1 && (
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                              {timeSlots.length}x
                            </span>
                          )}
                        </div>

                        {mission.location && (
                          <div className="flex items-center gap-2.5 sm:col-span-2">
                             <div className="p-1.5 bg-white/5 rounded-md">
                              <MapPin size={14} className="text-red-400" />
                            </div>
                            <span className="truncate">{mission.location}</span>
                          </div>
                        )}
                      </div>

                      {mission.description && (
                        <div className="mt-3 p-3 bg-dark-900/40 rounded-xl border border-white/5 text-sm text-gray-400 italic">
                          "{mission.description}"
                        </div>
                      )}

                      {/* Tags & Details */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                          {mission.details && mission.details.dayHours > 0 && (
                            <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/20 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              Jour: {mission.details.dayHours.toFixed(1)}h
                            </span>
                          )}
                          {mission.details && mission.details.nightHours > 0 && (
                            <span className="flex items-center gap-1.5 bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                              Nuit: {mission.details.nightHours.toFixed(1)}h
                            </span>
                          )}
                          
                          {/* Tarif horaire (Desktop only usually, but good to have) */}
                          {(() => {
                            const missionHours = (mission.details?.dayHours || 0) + (mission.details?.nightHours || 0);
                            const hourlyRate = missionHours > 0 && mission.totalEarnings 
                              ? mission.totalEarnings / missionHours 
                              : mission.hourlyRate || 0;
                            
                            if (hourlyRate > 0) {
                              return (
                                <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-xs font-medium ml-auto">
                                  <Euro size={12} />
                                  {hourlyRate.toFixed(2)}€/h
                                </span>
                              );
                            }
                            return null;
                          })()}
                      </div>
                    </div>

                    {/* Right side - Revenue (Desktop) */}
                    <div className="hidden md:block flex-shrink-0 self-center pl-6 border-l border-white/5">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Net</p>
                        <p className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                          {mission.totalEarnings?.toFixed(0)}€
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 mt-12 bg-black/20 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-center">
          <p className="text-sm text-gray-400">
            Vous souhaitez gérer vos propres missions ?{' '}
            <button
              onClick={onLoginClick}
              className="text-primary-400 hover:text-primary-300 font-bold hover:underline transition-all"
            >
              Connectez-vous à NeuroTime
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicMissionsView;



