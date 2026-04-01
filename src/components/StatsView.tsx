import React, { useMemo } from 'react';
import { Mission } from '../types';
import { format, subMonths, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Users,
  CalendarRange,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDashboardStats } from '../hooks/useDashboardStats';

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────────────────────────────── */

// Cohesive palette: brand-aligned, not random
const CHART_COLORS = [
  '#818cf8', // indigo-400   — primary brand
  '#34d399', // emerald-400  — success/income
  '#fbbf24', // amber-400    — gold/value
  '#60a5fa', // blue-400
  '#f472b6', // pink-400
  '#22d3ee', // cyan-400
  '#a78bfa', // violet-400
  '#4ade80', // green-400
];

const AXIS_STYLE = { fill: '#64748b', fontSize: 11, fontFamily: 'Figtree, system-ui' };
const GRID_COLOR = 'rgba(148, 163, 184, 0.08)';

/* ─────────────────────────────────────────────────────────────────
   CUSTOM TOOLTIPS — glass surface, DM Mono values
   ───────────────────────────────────────────────────────────────── */

interface BarTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  hidePrices?: boolean;
}

const GlassRevenueTooltip: React.FC<BarTooltipProps> = ({
  active, payload, label, hidePrices,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl border border-white/[0.10] px-3.5 py-3 shadow-xl min-w-[150px]">
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
        {label}
      </p>
      <p className="num-financial text-base font-bold text-gold-400 leading-none">
        {hidePrices
          ? '*** €'
          : `${payload[0].value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
        }
      </p>
      <p className="text-[10px] text-gray-500 mt-1">Chiffre d'affaires</p>
    </div>
  );
};

interface CountTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const GlassCountTooltip: React.FC<CountTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const n = payload[0].value;
  return (
    <div className="glass-strong rounded-xl border border-white/[0.10] px-3.5 py-3 shadow-xl">
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
        {label}
      </p>
      <p className="num-financial text-base font-bold text-teal-400 leading-none">
        {n} <span className="text-[11px] font-normal text-gray-400">mission{n > 1 ? 's' : ''}</span>
      </p>
    </div>
  );
};

interface PieTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
  hidePrices?: boolean;
}

const GlassPieTooltip: React.FC<PieTooltipProps> = ({ active, payload, hidePrices }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="glass-strong rounded-xl border border-white/[0.10] px-3.5 py-3 shadow-xl">
      <p className="text-[11px] font-bold text-gray-200 mb-1.5 leading-snug">{entry.name}</p>
      <p className="num-financial text-sm font-bold text-gold-400 leading-none">
        {hidePrices
          ? '*** €'
          : `${entry.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
        }
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */

interface StatsViewProps {
  missions: Mission[];
  hidePrices?: boolean;
}

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
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(startOfMonth(selectedMonthDate), i);
      const key = format(monthDate, 'yyyy-MM');
      map.set(key, { label: format(monthDate, 'MMM yy', { locale: fr }), revenue: 0 });
    }
    missions.forEach((m) => {
      if (m.status !== 'completed') return;
      const key = format(startOfMonth(new Date(m.endTime)), 'yyyy-MM');
      if (!map.has(key)) return;
      map.get(key)!.revenue += m.totalEarnings || 0;
    });
    return Array.from(map.values()).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
    }));
  }, [missions, selectedMonthDate]);

  const clientRevenueData = useMemo(() => {
    const map = new Map<string, number>();
    missions.forEach((m) => {
      if (m.status !== 'completed' || !m.client) return;
      map.set(m.client, (map.get(m.client) ?? 0) + (m.totalEarnings || 0));
    });
    return Array.from(map.entries())
      .map(([client, value]) => ({ client, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [missions]);

  const weekdayData = useMemo(() => {
    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const counts = new Array(7).fill(0);
    missions.forEach((m) => {
      if (m.status !== 'completed') return;
      counts[new Date(m.startTime).getDay()] += 1;
    });
    return counts.map((count, index) => ({ day: dayLabels[index], count }));
  }, [missions]);

  const fmt = (v: number | undefined | null) => {
    if (hidePrices) return '***';
    if (!v) return '0';
    return v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2.5 rounded-xl bg-primary-500/15 border border-primary-500/30 shadow-lg shadow-primary-500/10">
              <BarChart3 className="w-5 h-5 text-primary-300" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-50 tracking-tight">
              Statistiques
            </h1>
          </div>
          <p className="text-xs text-gray-500 ml-[52px]">
            Période :{' '}
            <span className="font-semibold text-primary-300">
              {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
            </span>
          </p>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          icon={<TrendingUp className="w-4 h-4 text-primary-200" />}
          iconBg="bg-primary-500/20 border-primary-500/40"
          gradient="from-primary-600/15 via-primary-500/10 to-transparent"
          border="border-primary-500/20"
          label="Revenus (mois)"
          value={`${fmt(totalEarnings)}${!hidePrices ? ' €' : ''}`}
          sub={!hidePrices ? `${fmt(totalEarningsCompleted)} € réalisés · ${fmt(totalEarningsPlanned)} € prévus` : undefined}
          valueClass="text-gold-400"
        />
        <KpiCard
          icon={<Clock className="w-4 h-4 text-emerald-200" />}
          iconBg="bg-emerald-500/20 border-emerald-500/40"
          gradient="from-emerald-600/15 via-emerald-500/10 to-transparent"
          border="border-emerald-500/20"
          label="Heures (mois)"
          value={`${totalHours.toFixed(1)} h`}
          sub={hidePrices ? undefined : `Taux horaire moy. ${averageHourlyRate.toFixed(2)} €/h`}
          valueClass="text-emerald-300"
        />
        <KpiCard
          icon={<Target className="w-4 h-4 text-blue-200" />}
          iconBg="bg-blue-500/20 border-blue-500/40"
          gradient="from-blue-600/15 via-blue-500/10 to-transparent"
          border="border-blue-500/20"
          label="Complétion"
          value={`${completionRate}%`}
          sub={`${selectedMonthCompletedMissions.length} terminées · ${upcomingMissions.length} à venir`}
          valueClass="text-blue-300"
        />
        <KpiCard
          icon={<CalendarRange className="w-4 h-4 text-violet-200" />}
          iconBg="bg-violet-500/20 border-violet-500/40"
          gradient="from-violet-600/15 via-violet-500/10 to-transparent"
          border="border-violet-500/20"
          label="vs mois préc."
          value={`${monthlyComparison.percentage > 0 ? '+' : ''}${monthlyComparison.percentage.toFixed(1)}%`}
          sub={!hidePrices ? `${fmt(monthlyComparison.thisMonth)} € vs ${fmt(monthlyComparison.lastMonth)} €` : undefined}
          valueClass={monthlyComparison.isPositive ? 'text-emerald-300' : 'text-rose-300'}
        />
      </div>

      {/* ── Revenue Chart + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* 12-month revenue bar chart */}
        <div className="glass-card rounded-2xl p-5 lg:col-span-2 border border-white/[0.06]">
          <ChartHeader
            icon={<BarChart3 className="w-4 h-4 text-primary-300" />}
            iconBg="bg-primary-500/15 border-primary-500/25"
            title="CA — 12 derniers mois"
            sub="Missions terminées, mois par mois"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRevenueData}
                margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
                barCategoryGap="30%"
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#818cf8" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.30} />
                  </linearGradient>
                  <linearGradient id="revenueGradientActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#a5b4fc" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.60} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={GRID_COLOR}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  tick={AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => hidePrices ? '—' : `${v / 1000}k`}
                  width={36}
                />
                <RechartsTooltip
                  content={<GlassRevenueTooltip hidePrices={hidePrices} />}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: [4, 4, 0, 0] }}
                />
                <Bar
                  dataKey="revenue"
                  name="CA"
                  radius={[5, 5, 0, 0]}
                  fill="url(#revenueGradient)"
                  activeBar={{ fill: 'url(#revenueGradientActive)', stroke: 'rgba(165,180,252,0.3)', strokeWidth: 1 }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client pie chart */}
        <div className="glass-card rounded-2xl p-5 border border-white/[0.06]">
          <ChartHeader
            icon={<Users className="w-4 h-4 text-amber-300" />}
            iconBg="bg-amber-500/15 border-amber-500/25"
            title="Top clients"
            sub="Répartition CA par client"
          />

          {clientRevenueData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-xs text-gray-500 italic">
              Aucune mission terminée
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Donut */}
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientRevenueData}
                      dataKey="value"
                      nameKey="client"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={3}
                      strokeWidth={0}
                      isAnimationActive
                      animationBegin={100}
                      animationDuration={700}
                      animationEasing="ease-out"
                    >
                      {clientRevenueData.map((entry, index) => (
                        <Cell
                          key={entry.client}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          opacity={0.9}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={<GlassPieTooltip hidePrices={hidePrices} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend list */}
              <div className="w-full space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {clientRevenueData.map((client, index) => (
                  <div
                    key={client.client}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5
                               rounded-lg bg-white/[0.03] border border-white/[0.04]
                               hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-[11px] font-medium text-gray-200 truncate">
                        {client.client}
                      </span>
                    </div>
                    <span className="num-financial text-[11px] font-bold text-gold-400 shrink-0">
                      {hidePrices
                        ? '***'
                        : `${client.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Weekday distribution ── */}
      <div className="glass-card rounded-2xl p-5 border border-white/[0.06]">
        <ChartHeader
          icon={<BarChart3 className="w-4 h-4 text-teal-300" />}
          iconBg="bg-teal-500/15 border-teal-500/25"
          title="Missions par jour de la semaine"
          sub="Toutes les missions terminées"
        />
        <div className="h-56 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekdayData}
              margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
              barCategoryGap="35%"
            >
              <defs>
                <linearGradient id="weekdayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#2dd4bf" stopOpacity={0.90} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.30} />
                </linearGradient>
                <linearGradient id="weekdayGradientActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#5eead4" stopOpacity={1} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="0"
                stroke={GRID_COLOR}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <RechartsTooltip
                content={<GlassCountTooltip />}
                cursor={{ fill: 'rgba(20, 184, 166, 0.06)', radius: [4, 4, 0, 0] }}
              />
              <Bar
                dataKey="count"
                name="Missions"
                radius={[5, 5, 0, 0]}
                fill="url(#weekdayGradient)"
                activeBar={{ fill: 'url(#weekdayGradientActive)', stroke: 'rgba(94,234,212,0.3)', strokeWidth: 1 }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   LOCAL SUB-COMPONENTS
   ───────────────────────────────────────────────────────────────── */

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  gradient: string;
  border: string;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon, iconBg, gradient, border, label, value, sub, valueClass = 'text-gray-100',
}) => (
  <div className={`glass-card rounded-2xl p-4 border bg-gradient-to-br to-transparent ${gradient} ${border}`}>
    <div className={`inline-flex p-2 rounded-xl border mb-3 ${iconBg}`}>
      {icon}
    </div>
    <p className={`num-financial text-2xl md:text-3xl font-bold tracking-tight leading-none mb-1 ${valueClass}`}>
      {value}
    </p>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 leading-none mb-2">
      {label}
    </p>
    {sub && (
      <p className="text-[10px] text-gray-600 leading-snug">{sub}</p>
    )}
  </div>
);

interface ChartHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({ icon, iconBg, title, sub }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className={`p-2 rounded-lg border ${iconBg}`}>
      {icon}
    </div>
    <div>
      <h2 className="font-display text-sm font-bold text-gray-100 leading-tight">{title}</h2>
      <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
    </div>
  </div>
);

export default StatsView;
