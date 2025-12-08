import React, { useMemo } from 'react';
import { Mission } from '../types';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { 
  Euro, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Calendar, 
  Briefcase,
  Clock,
  MapPin,
  Filter,
  Download,
  FileText
} from 'lucide-react';
import { formatTimeSlots } from '../utils/timeSlots';

interface PaymentsViewProps {
  missions: Mission[];
  onTogglePaid: (mission: Mission) => void;
}

const PaymentsView: React.FC<PaymentsViewProps> = ({ missions, onTogglePaid }) => {
  // Filtrer uniquement les missions terminées
  const completedMissions = useMemo(() => 
    missions.filter(m => m.status === 'completed'),
    [missions]
  );

  const paidMissions = useMemo(() => 
    completedMissions.filter(m => m.isPaid),
    [completedMissions]
  );

  const unpaidMissions = useMemo(() => 
    completedMissions.filter(m => !m.isPaid),
    [completedMissions]
  );

  // Statistiques
  const totalPaid = useMemo(() => 
    paidMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [paidMissions]
  );

  const totalUnpaid = useMemo(() => 
    unpaidMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [unpaidMissions]
  );

  const totalCompleted = useMemo(() => 
    completedMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [completedMissions]
  );

  const paidPercentage = totalCompleted > 0 ? (totalPaid / totalCompleted) * 100 : 0;

  // Missions payées par mois
  const paidByMonth = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    paidMissions.forEach(m => {
      const monthKey = format(new Date(m.startTime), 'yyyy-MM', { locale: fr });
      const existing = map.get(monthKey) || { count: 0, total: 0 };
      map.set(monthKey, {
        count: existing.count + 1,
        total: existing.total + (m.totalEarnings || 0)
      });
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({
        month,
        ...data,
        date: new Date(month + '-01')
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [paidMissions]);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight mb-2">Suivi des Paiements</h1>
          <p className="text-gray-300 text-sm md:text-base font-medium">Gestion et suivi des missions payées</p>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
        {/* Total payé */}
        <div className="glass-card rounded-2xl p-5 md:p-6 border border-emerald-500/25 bg-gradient-to-br from-emerald-600/20 via-emerald-500/15 to-emerald-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/25 border border-emerald-500/50 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold text-emerald-200 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-full">
              {paidMissions.length} mission{paidMissions.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-3xl md:text-4xl font-black text-gray-100 mb-2 tracking-tight">{totalPaid.toFixed(2)} €</p>
          <p className="text-xs text-gray-300 font-medium">Total payé</p>
        </div>

        {/* Total non payé */}
        <div className="glass-card rounded-2xl p-5 md:p-6 border border-orange-500/25 bg-gradient-to-br from-orange-600/20 via-orange-500/15 to-orange-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-orange-500/25 border border-orange-500/50 shadow-lg shadow-orange-500/20">
              <Circle className="w-5 h-5 text-orange-200" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold text-orange-200 bg-orange-500/20 border border-orange-500/40 px-2.5 py-1 rounded-full">
              {unpaidMissions.length} mission{unpaidMissions.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-3xl md:text-4xl font-black text-gray-100 mb-2 tracking-tight">{totalUnpaid.toFixed(2)} €</p>
          <p className="text-xs text-gray-300 font-medium">En attente</p>
        </div>

        {/* Total terminé */}
        <div className="glass-card rounded-2xl p-5 md:p-6 border border-primary-500/25 bg-gradient-to-br from-primary-600/20 via-primary-500/15 to-primary-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-primary-500/25 border border-primary-500/50 shadow-lg shadow-primary-500/20">
              <Euro className="w-5 h-5 text-primary-200" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold text-primary-200 bg-primary-500/20 border border-primary-500/40 px-2.5 py-1 rounded-full">
              {completedMissions.length} mission{completedMissions.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-3xl md:text-4xl font-black text-gray-100 mb-2 tracking-tight">{totalCompleted.toFixed(2)} €</p>
          <p className="text-xs text-gray-300 font-medium">Total terminé</p>
        </div>

        {/* Taux de paiement */}
        <div className="glass-card rounded-2xl p-5 md:p-6 border border-blue-500/25 bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-blue-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/25 border border-blue-500/50 shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-200" strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-black text-gray-100 mb-2 tracking-tight">{paidPercentage.toFixed(1)}%</p>
          <p className="text-xs text-gray-300 font-medium">Taux de paiement</p>
        </div>
      </div>

      {/* Missions non payées */}
      {unpaidMissions.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
          <div className="p-5 md:p-6 border-b border-primary-500/20">
            <h2 className="text-xl md:text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Circle size={20} className="text-orange-400" strokeWidth={2.5} />
              Missions en attente de paiement ({unpaidMissions.length})
            </h2>
            <p className="text-sm text-gray-400 mt-1">Total en attente : <span className="font-bold text-orange-300">{totalUnpaid.toFixed(2)} €</span></p>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead className="bg-dark-100/60 border-b border-primary-500/20 backdrop-blur-sm">
                <tr>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Date</th>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Mission</th>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Client</th>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Montant</th>
                  <th className="px-5 md:px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-500/10">
                {unpaidMissions
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((mission) => (
                    <tr key={mission.id} className="hover:bg-dark-100/40 transition-all">
                      <td className="px-5 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-sm">
                            {format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock size={12} />
                            {formatTimeSlots(mission)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 md:px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-sm">{mission.title}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin size={12} />
                            {mission.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 md:px-6 py-4">
                        <span className="text-sm text-primary-300 font-semibold flex items-center gap-1">
                          <Briefcase size={14} />
                          {mission.client}
                        </span>
                      </td>
                      <td className="px-5 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-black text-gray-100 bg-orange-500/20 border border-orange-500/40 px-3 py-1.5 rounded-lg w-fit text-sm">
                          {mission.totalEarnings?.toFixed(2) || '0.00'} <Euro size={12} strokeWidth={2.5} />
                        </div>
                      </td>
                      <td className="px-5 md:px-6 py-4 text-center">
                        <button
                          onClick={() => onTogglePaid(mission)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border shadow-sm transition-all hover:scale-105 bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30"
                          title="Marquer comme payé"
                        >
                          <CheckCircle2 size={14} strokeWidth={2.5} />
                          Marquer payé
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missions payées */}
      {paidMissions.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
          <div className="p-5 md:p-6 border-b border-primary-500/20">
            <h2 className="text-xl md:text-2xl font-bold text-gray-100 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-400" strokeWidth={2.5} />
              Missions payées ({paidMissions.length})
            </h2>
            <p className="text-sm text-gray-400 mt-1">Total payé : <span className="font-bold text-emerald-300">{totalPaid.toFixed(2)} €</span></p>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[800px]">
              <thead className="bg-dark-100/60 border-b border-primary-500/20 backdrop-blur-sm">
                <tr>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Date</th>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Mission</th>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Client</th>
                  <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Montant</th>
                  <th className="px-5 md:px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-500/10">
                {paidMissions
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((mission) => (
                    <tr key={mission.id} className="hover:bg-dark-100/40 transition-all">
                      <td className="px-5 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-sm">
                            {format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Clock size={12} />
                            {formatTimeSlots(mission)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 md:px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-sm">{mission.title}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin size={12} />
                            {mission.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 md:px-6 py-4">
                        <span className="text-sm text-primary-300 font-semibold flex items-center gap-1">
                          <Briefcase size={14} />
                          {mission.client}
                        </span>
                      </td>
                      <td className="px-5 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-black text-gray-100 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-lg w-fit text-sm">
                          {mission.totalEarnings?.toFixed(2) || '0.00'} <Euro size={12} strokeWidth={2.5} />
                        </div>
                      </td>
                      <td className="px-5 md:px-6 py-4 text-center">
                        <button
                          onClick={() => onTogglePaid(mission)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all bg-emerald-500/30 text-emerald-200 border-emerald-500/50"
                          title="Marquer comme non payé"
                        >
                          <CheckCircle2 size={14} strokeWidth={2.5} />
                          Payé
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aucune mission terminée */}
      {completedMissions.length === 0 && (
        <div className="glass-card rounded-2xl p-10 md:p-14 text-center">
          <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-dark-100/80 rounded-2xl flex items-center justify-center mb-4 md:mb-5 border border-primary-500/20 shadow-lg">
            <Euro size={28} className="text-gray-400" strokeWidth={2} />
          </div>
          <p className="text-lg md:text-xl font-bold text-gray-200 mb-2">Aucune mission terminée</p>
          <p className="text-xs md:text-sm text-gray-400 font-medium">Terminez des missions pour voir le suivi des paiements</p>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;

