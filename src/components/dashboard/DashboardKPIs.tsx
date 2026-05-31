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
    <div className="space-y-3">
      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-2.5">
        <div className="col-span-2 md:col-span-12 lg:col-span-6">
          <StatCard
            icon={<Euro className="w-4 h-4 text-[var(--success)]" />}
            label="Chiffre d'Affaires"
            value={formatPriceWithSymbol(totalEarnings)}
            subtext={hidePrices ? '***' : `Encaissé: ${formatPrice(totalEarningsCollected)}€ · Prév: ${formatPrice(totalEarningsExpected)}€`}
            color=""
            textColor="text-[var(--success)]"
            accentColor="border-[var(--primary)]"
            animationDelay="0ms"
            trend={monthlyComparison.percentage !== 0 ? {
              value: Math.abs(monthlyComparison.percentage),
              isPositive: monthlyComparison.isPositive,
            } : undefined}
            onClick={onRevenueClick}
          />
        </div>

        <div className="col-span-1 md:col-span-6 lg:col-span-3">
          <StatCard
            icon={<Clock className="w-4 h-4 text-[var(--primary)]" />}
            label="Volume Horaire"
            value={`${totalHours.toFixed(1)}h`}
            subtext={`J: ${totalDayHours}h · N: ${totalNightHours}h`}
            color=""
            textColor="text-[var(--primary)]"
            accentColor="border-[var(--warning)]"
            animationDelay="60ms"
          />
        </div>

        <div className="col-span-1 md:col-span-6 lg:col-span-3">
          <StatCard
            icon={<CheckCircle className="w-4 h-4 text-[#a78bfa]" />}
            label="Clôturées"
            value={completedMissionsCount.toString()}
            subtext={`${upcomingMissionsCount} à venir`}
            color=""
            textColor="text-[#a78bfa]"
            accentColor="border-[var(--success)]"
            animationDelay="120ms"
          />
        </div>
      </div>

      {/* Secondary KPIs - Compact Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          icon={<DollarSign className="w-3.5 h-3.5 text-[var(--primary)]" />}
          label="Taux Horaire"
          value={hidePrices ? '***' : `${averageHourlyRate.toFixed(0)}€/h`}
          subtext={`J: ${averageDayHourlyRate.toFixed(0)}€ · N: ${averageNightHourlyRate.toFixed(0)}€`}
          color=""
          textColor="text-[var(--primary)]"
          accentColor="border-[var(--primary)]"
          animationDelay="180ms"
        />
        <StatCard
          icon={monthlyComparison.isPositive ? <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" /> : <TrendingDown className="w-3.5 h-3.5 text-[var(--danger)]" />}
          label="Croissance"
          value={`${monthlyComparison.isPositive ? '+' : ''}${monthlyComparison.percentage.toFixed(0)}%`}
          subtext="vs mois précédent"
          color=""
          textColor={monthlyComparison.isPositive ? "text-[var(--success)]" : "text-[var(--danger)]"}
          accentColor={monthlyComparison.isPositive ? "border-[var(--success)]" : "border-[var(--danger)]"}
          animationDelay="240ms"
        />
        <StatCard
          icon={<Award className={`w-3.5 h-3.5 ${mostProfitableMission ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'}`} />}
          label="Top Mission"
          value={mostProfitableMission ? formatPriceWithSymbol(mostProfitableMission.totalEarnings) : '—'}
          subtext={mostProfitableMission ? mostProfitableMission.title : 'Aucune'}
          color=""
          textColor={mostProfitableMission ? "text-[var(--warning)]" : "text-[var(--text-tertiary)]"}
          accentColor="border-[var(--warning)]"
          animationDelay="300ms"
        />
      </div>
    </div>
  );
};

export default DashboardKPIs;
