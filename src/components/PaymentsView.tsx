import React, { useMemo } from 'react';
import { Mission } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
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
  hidePrices?: boolean;
}

const PaymentsView: React.FC<PaymentsViewProps> = ({ missions, onTogglePaid, hidePrices = false }) => {
  const formatPrice = (value: number | null | undefined, decimals: number = 2): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(decimals);
  };

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

  return (
    <div className="space-y-4 md:space-y-5 pb-20 md:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-gray-100 tracking-tight">Suivi des Paiements</h1>
          <p className="text-gray-500 text-[10px] font-medium">Missions payées & en attente</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Total payé */}
        <div className="glass-card rounded-xl p-3 border border-emerald-500/15 bg-gradient-to-br from-emerald-600/[0.06] to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-semibold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              {paidMissions.length}
            </span>
          </div>
          <p className="text-lg font-extrabold text-gray-100 mb-0.5 tracking-tight">{formatPrice(totalPaid, 0)} €</p>
          <p className="text-[9px] text-gray-400">Total payé</p>
        </div>

        {/* Total non payé */}
        <div className="glass-card rounded-xl p-3 border border-orange-500/15 bg-gradient-to-br from-orange-600/[0.06] to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/25">
              <Circle className="w-3.5 h-3.5 text-orange-300" strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-semibold text-orange-300 bg-orange-500/10 px-1.5 py-0.5 rounded-md">
              {unpaidMissions.length}
            </span>
          </div>
          <p className="text-lg font-extrabold text-gray-100 mb-0.5 tracking-tight">{formatPrice(totalUnpaid, 0)} €</p>
          <p className="text-[9px] text-gray-400">En attente</p>
        </div>

        {/* Total terminé */}
        <div className="glass-card rounded-xl p-3 border border-indigo-500/15 bg-gradient-to-br from-indigo-600/[0.06] to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25">
              <Euro className="w-3.5 h-3.5 text-indigo-300" strokeWidth={2.5} />
            </div>
            <span className="text-[8px] font-semibold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
              {completedMissions.length}
            </span>
          </div>
          <p className="text-lg font-extrabold text-gray-100 mb-0.5 tracking-tight">{formatPrice(totalCompleted, 0)} €</p>
          <p className="text-[9px] text-gray-400">Total terminé</p>
        </div>

        {/* Taux de paiement */}
        <div className="glass-card rounded-xl p-3 border border-blue-500/15 bg-gradient-to-br from-blue-600/[0.06] to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25">
              <TrendingUp className="w-3.5 h-3.5 text-blue-300" strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-lg font-extrabold text-gray-100 mb-0.5 tracking-tight">{paidPercentage.toFixed(0)}%</p>
          <p className="text-[9px] text-gray-400">Taux de paiement</p>
        </div>
      </div>

      {/* Missions non payées */}
      {unpaidMissions.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-3 md:p-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
              <Circle size={14} className="text-orange-400" strokeWidth={2.5} />
              En attente ({unpaidMissions.length})
            </h2>
            {!hidePrices && <p className="text-[10px] text-gray-500 mt-0.5">Total : <span className="font-bold text-orange-300">{formatPrice(totalUnpaid, 0)} €</span></p>}
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px]">
              <thead className="bg-white/[0.02] border-b border-white/[0.04]">
                <tr>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mission</th>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                  <th className="px-3 md:px-4 py-2.5 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {unpaidMissions
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((mission) => (
                    <tr key={mission.id} className="hover:bg-white/[0.02] transition-all">
                      <td className="px-3 md:px-4 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-[11px]">{format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}</span>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={9} />{formatTimeSlots(mission)}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-[11px]">{mission.title}</span>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{mission.location}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2.5">
                        <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1"><Briefcase size={11} />{mission.client}</span>
                      </td>
                      <td className="px-3 md:px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-0.5 font-bold text-gray-100 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-md w-fit text-[11px]">
                          {formatPrice(mission.totalEarnings, 0)} {!hidePrices && <Euro size={10} strokeWidth={2.5} />}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2.5 text-center">
                        <button
                          onClick={() => onTogglePaid(mission)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:scale-105 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                          title="Marquer comme payé"
                        >
                          <CheckCircle2 size={12} strokeWidth={2.5} />
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

      {/* Missions payées */}
      {paidMissions.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-3 md:p-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" strokeWidth={2.5} />
              Missions payées ({paidMissions.length})
            </h2>
            {!hidePrices && <p className="text-[10px] text-gray-500 mt-0.5">Total : <span className="font-bold text-emerald-300">{formatPrice(totalPaid, 0)} €</span></p>}
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px]">
              <thead className="bg-white/[0.02] border-b border-white/[0.04]">
                <tr>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mission</th>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-3 md:px-4 py-2.5 text-left text-[9px] font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                  <th className="px-3 md:px-4 py-2.5 text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paidMissions
                  .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                  .map((mission) => (
                    <tr key={mission.id} className="hover:bg-white/[0.02] transition-all">
                      <td className="px-3 md:px-4 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-[11px]">{format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}</span>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={9} />{formatTimeSlots(mission)}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100 text-[11px]">{mission.title}</span>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{mission.location}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2.5">
                        <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1"><Briefcase size={11} />{mission.client}</span>
                      </td>
                      <td className="px-3 md:px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-0.5 font-bold text-gray-100 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md w-fit text-[11px]">
                          {formatPrice(mission.totalEarnings, 0)} {!hidePrices && <Euro size={10} strokeWidth={2.5} />}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-2.5 text-center">
                        <button
                          onClick={() => onTogglePaid(mission)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/25 transition-all"
                          title="Marquer comme non payé"
                        >
                          <CheckCircle2 size={12} strokeWidth={2.5} />
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

      {/* Empty state */}
      {completedMissions.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-white/[0.04] rounded-xl flex items-center justify-center mb-3 border border-white/[0.06]">
            <Euro size={20} className="text-gray-400" strokeWidth={2} />
          </div>
          <p className="text-sm font-bold text-gray-200 mb-1">Aucune mission terminée</p>
          <p className="text-[10px] text-gray-500">Terminez des missions pour voir le suivi</p>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;
