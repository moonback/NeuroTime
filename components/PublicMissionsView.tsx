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
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <div className="glass-strong border-b border-primary-500/20 sticky top-0 z-20">
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
              className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
            >
              <LogIn size={18} />
              <span>Se connecter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="glass-card rounded-2xl p-4 md:p-5 border-primary-500/20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-primary-400" />
              <span className="text-sm font-bold text-gray-300">Période :</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    periodType === period
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-dark-200/50 text-gray-400 hover:text-gray-200 hover:bg-dark-200'
                  }`}
                >
                  {period === 'all' ? 'Toutes' : 
                   period === 'month' ? 'Ce mois' :
                   period === 'quarter' ? 'Ce trimestre' :
                   period === 'year' ? 'Cette année' : 'Personnalisé'}
                </button>
              ))}
            </div>
            {showCustomDates && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-dark-200/50 border border-primary-500/20 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-primary-500/50"
                  placeholder="Date de début"
                />
                <span className="text-gray-400 text-sm">à</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-dark-200/50 border border-primary-500/20 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-primary-500/50"
                  placeholder="Date de fin"
                />
              </div>
            )}
            {periodType !== 'all' && periodDates.start && periodDates.end && (
              <div className="text-xs text-gray-400 ml-auto">
                {format(new Date(periodDates.start), 'd MMM yyyy', { locale: fr })} - {format(new Date(periodDates.end), 'd MMM yyyy', { locale: fr })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {missions.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="glass-card rounded-2xl p-4 md:p-6 border-primary-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Missions</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-100">{missions.length}</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-6 border-primary-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                  <Euro size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Revenus</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-100">{totalRevenue.toFixed(0)}€</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-6 border-primary-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-500/20 rounded-lg border border-primary-500/30">
                  <Clock size={20} className="text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Heures</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-100">{totalHours.toFixed(0)}h</p>
                </div>
              </div>
            </div>
            {totalHours > 0 && (
              <div className="glass-card rounded-2xl p-4 md:p-6 border-primary-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <Euro size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Tarif horaire moyen</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-100">{averageHourlyRate.toFixed(2)}€/h</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Missions List */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">
        {error ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        ) : missions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary-500/20 rounded-full border border-primary-500/30">
                <Calendar size={32} className="text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-100 mb-2">Aucune mission terminée</h3>
                <p className="text-gray-400">Les missions terminées apparaîtront ici.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {missions.map((mission) => {
              const missionDate = new Date(mission.startTime);
              const timeSlots = getMissionTimeSlots(mission);
              
              return (
                <div
                  key={mission.id}
                  className="glass-card rounded-2xl p-4 md:p-6 border-primary-500/20 hover:border-primary-500/30 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Left side - Mission details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        <h3 className="text-lg md:text-xl font-bold text-gray-100">{mission.title}</h3>
                      </div>

                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-500" />
                          <span className="font-medium">
                            {format(missionDate, 'EEEE d MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-500" />
                          <span>{formatTimeSlots(mission)}</span>
                          {timeSlots.length > 1 && (
                            <span className="text-xs bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded border border-primary-500/30">
                              {timeSlots.length} créneaux
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-gray-500" />
                          <span>{mission.client}</span>
                        </div>
                        {mission.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            <span className="truncate">{mission.location}</span>
                          </div>
                        )}
                      </div>

                      {mission.description && (
                        <p className="mt-3 text-sm text-gray-300 line-clamp-2">{mission.description}</p>
                      )}

                      {mission.details && (mission.details.dayHours > 0 || mission.details.nightHours > 0) && (
                        <div className="flex items-center gap-2 mt-3 text-xs">
                          {mission.details.dayHours > 0 && (
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                              Jour: {mission.details.dayHours.toFixed(1)}h
                            </span>
                          )}
                          {mission.details.nightHours > 0 && (
                            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                              Nuit: {mission.details.nightHours.toFixed(1)}h
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tarif horaire */}
                      {(() => {
                        const missionHours = (mission.details?.dayHours || 0) + (mission.details?.nightHours || 0);
                        const hourlyRate = missionHours > 0 && mission.totalEarnings 
                          ? mission.totalEarnings / missionHours 
                          : mission.hourlyRate || 0;
                        
                        if (hourlyRate > 0) {
                          return (
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                              <Euro size={12} className="text-gray-500" />
                              <span className="font-medium">
                                Tarif horaire: <span className="text-blue-300 font-bold">{hourlyRate.toFixed(2)}€/h</span>
                                {mission.rateType && mission.rateType !== 'custom' && (
                                  <span className="ml-1 text-[10px] text-gray-500">
                                    ({mission.rateType === 'day' ? 'jour' : mission.rateType === 'night' ? 'nuit' : 'mixte'})
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Right side - Revenue */}
                    <div className="flex-shrink-0">
                      <div className="glass-light rounded-xl p-4 border-primary-500/20 text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Revenu</p>
                        <p className="text-2xl md:text-3xl font-black text-emerald-400">
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
      <div className="border-t border-primary-500/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-center">
          <p className="text-sm text-gray-400">
            Vous souhaitez gérer vos propres missions ?{' '}
            <button
              onClick={onLoginClick}
              className="text-primary-400 hover:text-primary-300 font-bold underline"
            >
              Connectez-vous
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicMissionsView;

