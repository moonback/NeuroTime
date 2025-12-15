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
    <>
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          icon={<Euro className="w-6 h-6 text-emerald-400" />}
          label={`CA ${format(selectedMonthDate, 'MMM yy', { locale: fr })}`}
          value={formatPriceWithSymbol(totalEarnings)}
          subtext={hidePrices ? '***' : `Réalisé: ${formatPrice(totalEarningsCompleted)}€`}
          color="bg-emerald-500/10 border-emerald-500/30"
          textColor="text-emerald-400"
          trend={monthlyComparison.percentage !== 0 ? {
            value: Math.abs(monthlyComparison.percentage),
            isPositive: monthlyComparison.isPositive,
          } : undefined}
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-primary-400" />}
          label="Heures"
          value={`${totalHours.toFixed(1)} h`}
          subtext="Heures terminées"
          color="bg-primary-500/10 border-primary-500/30"
          textColor="text-primary-400"
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-purple-400" />}
          label="Missions"
          value={completedMissionsCount.toString()}
          subtext="Terminées"
          color="bg-purple-500/10 border-purple-500/30"
          textColor="text-purple-400"
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-orange-400" />}
          label="À venir"
          value={upcomingMissionsCount.toString()}
          subtext="Planifiées"
          color="bg-orange-500/10 border-orange-500/30"
          textColor="text-orange-400"
        />
      </div>

      {/* KPIs Avancés - Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard 
          icon={<DollarSign className="w-5 h-5 text-blue-400" />}
          label="Taux horaire"
          value={hidePrices ? '***' : `${averageHourlyRate.toFixed(0)} €/h`}
          subtext="Moyen"
          color="bg-blue-500/10 border-blue-500/30"
          textColor="text-blue-400"
        />
        <StatCard 
          icon={monthlyComparison.isPositive ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          label="Évolution"
          value={`${monthlyComparison.isPositive ? '+' : ''}${monthlyComparison.percentage.toFixed(0)}%`}
          subtext="vs mois préc."
          color={monthlyComparison.isPositive ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}
          textColor={monthlyComparison.isPositive ? "text-green-400" : "text-red-400"}
        />
        {mostProfitableMission && (
          <StatCard 
            icon={<Award className="w-5 h-5 text-yellow-400" />}
            label="Top Mission"
            value={formatPriceWithSymbol(mostProfitableMission.totalEarnings)}
            subtext={mostProfitableMission.title}
            color="bg-yellow-500/10 border-yellow-500/30"
            textColor="text-yellow-400"
          />
        )}
      </div>
    </>
  );
};

export default DashboardKPIs;

