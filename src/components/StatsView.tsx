import React, { useMemo } from 'react';
import { Mission } from '../types';
import { format, subMonths, startOfMonth } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { 
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Users,
  CalendarRange
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDashboardStats } from '../hooks/useDashboardStats';

interface StatsViewProps {
  missions: Mission[];
  hidePrices?: boolean;
}

const COLORS = ['#34d399', '#60a5fa', '#f97316', '#f472b6', '#22d3ee', '#a855f7', '#facc15'];

const StatsView: React.FC<StatsViewProps> = ({ missions, hidePrices = false }) => {
  const {
    selectedMonthDate,
    totalHours,
    totalEarnings,
    totalEarningsCompleted,
    totalEarningsPlanned,
    selectedMonthCompletedMissions,
    upcomingMissions,
    averageHourlyRate,
    monthlyComparison,
  } = useDashboardStats(missions);

  const completionRate = useMemo(() => {
    const completed = selectedMonthCompletedMissions.length;
    const total = completed + upcomingMissions.length;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [selectedMonthCompletedMissions.length, upcomingMissions.length]);

  const monthlyRevenueData = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number }>();

    // 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(startOfMonth(selectedMonthDate), i);
      const key = format(monthDate, 'yyyy-MM');
      map.set(key, {
        label: format(monthDate, 'MMM yy', { locale: fr }),
        revenue: 0,
      });
    }

    missions.forEach((m) => {
      if (m.status !== 'completed') return;
      const end = new Date(m.endTime);
      const key = format(startOfMonth(end), 'yyyy-MM');
      if (!map.has(key)) return;
      const current = map.get(key)!;
      current.revenue += m.totalEarnings || 0;
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
    }));
  }, [missions, selectedMonthDate]);

  const clientRevenueData = useMemo(() => {
    const map = new Map<string, number>();

    missions.forEach((m) => {
      if (m.status !== 'completed') return;
      if (!m.client) return;
      const prev = map.get(m.client) ?? 0;
      map.set(m.client, prev + (m.totalEarnings || 0));
    });

    const all = Array.from(map.entries()).map(([client, value]) => ({
      client,
      value: Math.round(value * 100) / 100,
    }));

    all.sort((a, b) => b.value - a.value);

    return all.slice(0, 8);
  }, [missions]);

  const weekdayData = useMemo(() => {
    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const counts = new Array(7).fill(0);

    missions.forEach((m) => {
      if (m.status !== 'completed') return;
      const day = new Date(m.startTime).getDay();
      counts[day] += 1;
    });

    return counts.map((count, index) => ({
      day: dayLabels[index],
      count,
    }));
  }, [missions]);

  const formatAmount = (value: number | undefined | null) => {
    if (hidePrices) return '***';
    if (!value) return '0';
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 justify-between items-start md:items-center mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary-500/15 border border-primary-500/40 shadow-lg shadow-primary-500/20">
              <BarChart3 className="w-6 h-6 text-primary-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-50 tracking-tight">
                Statistiques détaillées
              </h1>
              <p className="text-gray-400 text-sm md:text-base font-medium mt-1">
                Analyse avancée de votre activité et de vos revenus
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Période actuelle :{' '}
            <span className="font-semibold text-primary-200">
              {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
        <div className="glass-card rounded-2xl p-5 md:p-6 border border-primary-500/25 bg-gradient-to-br from-primary-600/20 via-primary-500/15 to-primary-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-primary-500/25 border border-primary-500/50">
              <TrendingUp className="w-5 h-5 text-primary-100" />
            </div>
          </div>
          <p className="text-xs text-gray-300 font-medium mb-1">Revenus totaux (mois)</p>
          <p className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight">
            {formatAmount(totalEarnings)} {!hidePrices && <span className="text-base">€</span>}
          </p>
          {!hidePrices && (
            <p className="text-[11px] text-gray-400 mt-1">
              {formatAmount(totalEarningsCompleted)} € réalisés •{' '}
              {formatAmount(totalEarningsPlanned)} € prévus
            </p>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 md:p-6 border border-emerald-500/25 bg-gradient-to-br from-emerald-600/20 via-emerald-500/15 to-emerald-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/25 border border-emerald-500/50">
              <Clock className="w-5 h-5 text-emerald-100" />
            </div>
          </div>
          <p className="text-xs text-gray-300 font-medium mb-1">Heures travaillées (mois)</p>
          <p className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight">
            {totalHours.toFixed(1)} <span className="text-base">h</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Taux horaire moyen :{' '}
            <span className="font-semibold text-emerald-200">
              {hidePrices ? '***' : `${averageHourlyRate.toFixed(2)} €/h`}
            </span>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 md:p-6 border border-blue-500/25 bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-blue-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/25 border border-blue-500/50">
              <Target className="w-5 h-5 text-blue-100" />
            </div>
          </div>
          <p className="text-xs text-gray-300 font-medium mb-1">Taux de complétion (mois)</p>
          <p className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight">
            {completionRate}%
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {selectedMonthCompletedMissions.length} missions terminées •{' '}
            {upcomingMissions.length} à venir
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 md:p-6 border border-violet-500/25 bg-gradient-to-br from-violet-600/20 via-violet-500/15 to-violet-400/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-violet-500/25 border border-violet-500/50">
              <CalendarRange className="w-5 h-5 text-violet-100" />
            </div>
          </div>
          <p className="text-xs text-gray-300 font-medium mb-1">Évolution vs mois précédent</p>
          <p
            className={`text-3xl md:text-4xl font-black tracking-tight ${
              monthlyComparison.isPositive ? 'text-emerald-200' : 'text-rose-300'
            }`}
          >
            {monthlyComparison.percentage > 0 ? '+' : ''}
            {monthlyComparison.percentage.toFixed(1)}%
          </p>
          {!hidePrices && (
            <p className="text-[11px] text-gray-400 mt-1">
              {formatAmount(monthlyComparison.thisMonth)} € vs{' '}
              {formatAmount(monthlyComparison.lastMonth)} €
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-4 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary-500/20 p-2 rounded-lg border border-primary-500/30">
                <BarChart3 className="w-5 h-5 text-primary-300" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-100">
                  CA sur les 12 derniers mois
                </h2>
                <p className="text-xs text-gray-500">
                  Somme des missions terminées, mois par mois
                </p>
              </div>
            </div>
          </div>

          <div className="h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(value) => (hidePrices ? '***' : `${value / 1000}k`)}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderRadius: 12,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    fontSize: 12,
                  }}
                  formatter={(value: number) =>
                    hidePrices
                      ? ['***', 'CA']
                      : [
                          `${value.toLocaleString('fr-FR', {
                            maximumFractionDigits: 0,
                          })} €`,
                          'CA',
                        ]
                  }
                  labelFormatter={(label: string) => `Mois : ${label}`}
                />
                <Bar
                  dataKey="revenue"
                  name="CA"
                  radius={[6, 6, 0, 0]}
                  fill="url(#statsMonthlyGradient)"
                />
                <defs>
                  <linearGradient id="statsMonthlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                <Users className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-100">
                  Top clients par CA
                </h2>
                <p className="text-xs text-gray-500">Répartition des revenus par client</p>
              </div>
            </div>
          </div>

          {clientRevenueData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-xs text-gray-500">
              Aucune mission terminée avec un client renseigné
            </div>
          ) : (
            <div className="h-56 flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:w-1/2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientRevenueData}
                      dataKey="value"
                      nameKey="client"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {clientRevenueData.map((entry, index) => (
                        <Cell
                          key={entry.client}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderRadius: 12,
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        fontSize: 12,
                      }}
                      formatter={(value: number) =>
                        hidePrices
                          ? ['***', 'CA']
                          : [
                              `${value.toLocaleString('fr-FR', {
                                maximumFractionDigits: 0,
                              })} €`,
                              'CA',
                            ]
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2 space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                {clientRevenueData.map((client, index) => (
                  <div
                    key={client.client}
                    className="flex items-center justify-between gap-2 text-xs border border-white/5 rounded-lg px-2.5 py-1.5 bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="font-medium text-gray-100 line-clamp-1">
                        {client.client}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-100">
                        {hidePrices
                          ? '***'
                          : `${client.value.toLocaleString('fr-FR', {
                              maximumFractionDigits: 0,
                            })} €`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-sky-500/20 p-2 rounded-lg border border-sky-500/30">
              <BarChart3 className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-100">
                Répartition des missions par jour de la semaine
              </h2>
              <p className="text-xs text-gray-500">
                Basé sur toutes les missions terminées
              </p>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Legend />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderRadius: 12,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value}`, 'Missions']}
              />
              <Bar
                dataKey="count"
                name="Missions"
                radius={[6, 6, 0, 0]}
                fill="url(#weekdayGradient)"
              />
              <defs>
                <linearGradient id="weekdayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsView;


