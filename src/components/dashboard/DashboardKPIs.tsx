import React from 'react';
import { Euro, Clock, CheckCircle, TrendingUp, DollarSign, Award, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import StatCard from './StatCard';
import { Mission } from '../../types';

interface DashboardKPIsProps {
  selectedMonthDate: Date;
  totalEarnings: number;
  totalEarningsCompleted: number;
  totalEarningsPlanned: number;
  totalHours: number;
  completedMissionsCount: number;
  upcomingMissionsCount: number;
  averageHourlyRate: number;
  monthlyComparison: {
    percentage: number;
    isPositive: boolean;
    lastMonth: number;
  };
  mostProfitableMission: Mission | null;
  hidePrices?: boolean;
}

const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  selectedMonthDate,
  totalEarnings,
  totalEarningsCompleted,
  totalEarningsPlanned,
  totalHours,
  completedMissionsCount,
  upcomingMissionsCount,
  averageHourlyRate,
  monthlyComparison,
  mostProfitableMission,
  hidePrices = false
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
    <div className="space-y-4">
      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-12 lg:col-span-6">
          <StatCard
            icon={<Euro className="w-8 h-8 text-emerald-400" />}
            label={`Chiffre d'Affaires ${format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}`}
            value={formatPriceWithSymbol(totalEarnings)}
            subtext={hidePrices ? '***' : `Déjà réalisé: ${formatPrice(totalEarningsCompleted)}€ • En attente: ${formatPrice(totalEarningsPlanned)}€`}
            color="bg-emerald-500/5 border-emerald-500/20"
            textColor="text-emerald-400 text-glow-emerald"
            trend={monthlyComparison.percentage !== 0 ? {
              value: Math.abs(monthlyComparison.percentage),
              isPositive: monthlyComparison.isPositive,
            } : undefined}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-3">
          <StatCard
            icon={<Clock className="w-7 h-7 text-primary-400" />}
            label="Volume Horaire"
            value={`${totalHours.toFixed(1)} h`}
            subtext="Cumulées sur le mois"
            color="bg-primary-500/5 border-primary-500/20"
            textColor="text-primary-400 text-glow-primary"
          />
        </div>

        <div className="md:col-span-6 lg:col-span-3">
          <StatCard
            icon={<CheckCircle className="w-7 h-7 text-purple-400" />}
            label="Missions Clôturées"
            value={completedMissionsCount.toString()}
            subtext={`${upcomingMissionsCount} missions à venir`}
            color="bg-purple-500/5 border-purple-500/20"
            textColor="text-purple-400"
          />
        </div>
      </div>

      {/* Secondary KPIs - Compact Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-blue-400" />}
          label="Rentabilité"
          value={hidePrices ? '***' : `${averageHourlyRate.toFixed(0)} €/h`}
          subtext="Moyenne horaire"
          color="bg-blue-500/5 border-blue-500/20"
          textColor="text-blue-400"
        />
        <StatCard
          icon={monthlyComparison.isPositive ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          label="Performance"
          value={`${monthlyComparison.isPositive ? '+' : ''}${monthlyComparison.percentage.toFixed(0)}%`}
          subtext="vs mois précédent"
          color={monthlyComparison.isPositive ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}
          textColor={monthlyComparison.isPositive ? "text-green-400" : "text-red-400"}
        />
        <StatCard
          icon={<Award className={`w-5 h-5 ${mostProfitableMission ? 'text-yellow-400' : 'text-gray-400'}`} />}
          label="Performance Max"
          value={mostProfitableMission ? formatPriceWithSymbol(mostProfitableMission.totalEarnings) : '—'}
          subtext={mostProfitableMission ? mostProfitableMission.title : 'Aucune mission'}
          color={mostProfitableMission ? "bg-yellow-500/5 border-yellow-500/20" : "bg-white/5 border-white/10"}
          textColor={mostProfitableMission ? "text-yellow-400" : "text-gray-400"}
        />
      </div>
    </div>
  );
};

export default DashboardKPIs;

