import React from 'react';
import { Euro, Clock, CheckCircle, TrendingUp, DollarSign, Award, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import StatCard from './StatCard';
import { Mission } from '../../types';

interface DashboardKPIsProps {
  selectedMonthDate: Date;
  totalEarnings: number;
  totalEarningsCollected: number;
  totalEarningsExpected: number;
  totalHours: number;
  totalDayHours: number;
  totalNightHours: number;
  completedMissionsCount: number;
  upcomingMissionsCount: number;
  averageHourlyRate: number;
  averageDayHourlyRate: number;
  averageNightHourlyRate: number;
  monthlyComparison: {
    percentage: number;
    isPositive: boolean;
    lastMonth: number;
  };
  mostProfitableMission: Mission | null;
  hidePrices?: boolean;
  onRevenueClick?: () => void;
}

const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  selectedMonthDate,
  totalEarnings,
  totalEarningsCollected,
  totalEarningsExpected,
  totalHours,
  totalDayHours,
  totalNightHours,
  completedMissionsCount,
  upcomingMissionsCount,
  averageHourlyRate,
  averageDayHourlyRate,
  averageNightHourlyRate,
  monthlyComparison,
  mostProfitableMission,
  hidePrices = false,
  onRevenueClick
}) => {
  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };

  const formatPriceWithSymbol = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0 €';
    return `${value.toFixed(0)} €`;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
        <div className="sm:col-span-2 md:col-span-12 lg:col-span-6">
          <StatCard
            icon={<Euro className="w-4 h-4 text-emerald-400" />}
            label="Chiffre d'Affaires"
            value={formatPriceWithSymbol(totalEarnings)}
            subtext={hidePrices ? '***' : `Encaissé: ${formatPrice(totalEarningsCollected)}€ · Prév: ${formatPrice(totalEarningsExpected)}€`}
            color="bg-emerald-500/[0.03] border-emerald-500/15"
            textColor="text-emerald-400"
            trend={monthlyComparison.percentage !== 0 ? {
              value: Math.abs(monthlyComparison.percentage),
              isPositive: monthlyComparison.isPositive,
            } : undefined}
            onClick={onRevenueClick}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-3">
          <StatCard
            icon={<Clock className="w-4 h-4 text-indigo-400" />}
            label="Volume Horaire"
            value={`${totalHours.toFixed(1)}h`}
            subtext={`J: ${totalDayHours}h · N: ${totalNightHours}h`}
            color="bg-indigo-500/[0.03] border-indigo-500/15"
            textColor="text-indigo-400"
          />
        </div>

        <div className="md:col-span-6 lg:col-span-3">
          <StatCard
            icon={<CheckCircle className="w-4 h-4 text-purple-400" />}
            label="Clôturées"
            value={completedMissionsCount.toString()}
            subtext={`${upcomingMissionsCount} à venir`}
            color="bg-purple-500/[0.03] border-purple-500/15"
            textColor="text-purple-400"
          />
        </div>
      </div>

      {/* Secondary KPIs - Compact Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <StatCard
          icon={<DollarSign className="w-3.5 h-3.5 text-blue-400" />}
          label="Taux Horaire"
          value={hidePrices ? '***' : `${averageHourlyRate.toFixed(0)}€/h`}
          subtext={`J: ${averageDayHourlyRate.toFixed(0)}€ · N: ${averageNightHourlyRate.toFixed(0)}€`}
          color="bg-blue-500/[0.03] border-blue-500/15"
          textColor="text-blue-400"
        />
        <StatCard
          icon={monthlyComparison.isPositive ? <TrendingUp className="w-3.5 h-3.5 text-green-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          label="Croissance"
          value={`${monthlyComparison.isPositive ? '+' : ''}${monthlyComparison.percentage.toFixed(0)}%`}
          subtext="vs mois précédent"
          color={monthlyComparison.isPositive ? "bg-green-500/[0.03] border-green-500/15" : "bg-red-500/[0.03] border-red-500/15"}
          textColor={monthlyComparison.isPositive ? "text-green-400" : "text-red-400"}
        />
        <StatCard
          icon={<Award className={`w-3.5 h-3.5 ${mostProfitableMission ? 'text-amber-400' : 'text-gray-500'}`} />}
          label="Top Mission"
          value={mostProfitableMission ? formatPriceWithSymbol(mostProfitableMission.totalEarnings) : '—'}
          subtext={mostProfitableMission ? mostProfitableMission.title : 'Aucune'}
          color={mostProfitableMission ? "bg-amber-500/[0.03] border-amber-500/15" : "bg-white/[0.02] border-white/[0.06]"}
          textColor={mostProfitableMission ? "text-amber-400" : "text-gray-500"}
        />
      </div>
    </div>
  );
};

export default DashboardKPIs;
