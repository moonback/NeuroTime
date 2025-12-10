import React, { useMemo } from 'react';
import { Mission } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, addMonths, eachMonthOfInterval, isSameMonth, isBefore } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { TrendingUp, Target, DollarSign, AlertCircle } from 'lucide-react';

interface DashboardForecastProps {
  missions: Mission[];
}

const DashboardForecast: React.FC<DashboardForecastProps> = ({ missions }) => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  
  // Période de projection : mois actuel + 2 mois suivants
  const forecastPeriod = useMemo(() => {
    const endMonth = addMonths(currentMonthStart, 2);
    return eachMonthOfInterval({ start: currentMonthStart, end: endMonth });
  }, [currentMonthStart]);

  // Missions terminées (réalisé)
  const completedMissions = missions.filter(m => m.status === 'completed');
  
  // Missions planifiées (prévisionnel)
  const plannedMissions = missions.filter(m => m.status === 'planned');

  // Données de prévision pour les 3 prochains mois
  const forecastData = useMemo(() => {
    return forecastPeriod.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const isCurrentMonth = isSameMonth(month, now);
      const isPastMonth = isBefore(monthEnd, currentMonthStart);

      // Revenus réalisés (missions terminées dans ce mois)
      const realizedRevenue = completedMissions
        .filter(m => {
          const missionDate = new Date(m.endTime);
          return missionDate >= monthStart && missionDate <= monthEnd;
        })
        .reduce((sum, m) => sum + (m.totalEarnings || 0), 0);

      // Revenus prévisionnels (missions planifiées dans ce mois)
      const forecastRevenue = plannedMissions
        .filter(m => {
          const missionDate = new Date(m.startTime);
          return missionDate >= monthStart && missionDate <= monthEnd;
        })
        .reduce((sum, m) => sum + (m.totalEarnings || 0), 0);

      // Nombre de missions
      const realizedCount = completedMissions.filter(m => {
        const missionDate = new Date(m.endTime);
        return missionDate >= monthStart && missionDate <= monthEnd;
      }).length;

      const forecastCount = plannedMissions.filter(m => {
        const missionDate = new Date(m.startTime);
        return missionDate >= monthStart && missionDate <= monthEnd;
      }).length;

      return {
        month: format(monthStart, 'MMM', { locale: fr }),
        monthFull: format(monthStart, 'MMMM yyyy', { locale: fr }),
        realized: Math.round(realizedRevenue * 100) / 100,
        forecast: Math.round(forecastRevenue * 100) / 100,
        realizedCount,
        forecastCount,
        isCurrentMonth,
        isPastMonth,
      };
    });
  }, [forecastPeriod, completedMissions, plannedMissions, now, currentMonthStart]);

  // Totaux pour la période
  const totals = useMemo(() => {
    const totalRealized = forecastData.reduce((sum, d) => sum + d.realized, 0);
    const totalForecast = forecastData.reduce((sum, d) => sum + d.forecast, 0);
    return {
      realized: totalRealized,
      forecast: totalForecast,
      difference: totalForecast - totalRealized,
      percentage: totalRealized > 0 ? ((totalForecast - totalRealized) / totalRealized) * 100 : 0,
    };
  }, [forecastData]);

  // Revenus réalisés du mois actuel (pour comparaison)
  const currentMonthRealized = useMemo(() => {
    return forecastData.find(d => d.isCurrentMonth)?.realized || 0;
  }, [forecastData]);

  // Revenus prévisionnels du mois actuel
  const currentMonthForecast = useMemo(() => {
    return forecastData.find(d => d.isCurrentMonth)?.forecast || 0;
  }, [forecastData]);

  // Revenus prévisionnels des 2 prochains mois
  const nextMonthsForecast = useMemo(() => {
    return forecastData
      .filter(d => !d.isCurrentMonth && !d.isPastMonth)
      .reduce((sum, d) => sum + d.forecast, 0);
  }, [forecastData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-4 border border-primary-500/30 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-200 mb-2">{data.monthFull}</p>
          <div className="space-y-1.5">
            {data.realized > 0 && (
              <p className="text-xs">
                <span className="text-green-400">Réalisé:</span>{' '}
                <span className="font-semibold text-gray-100">{data.realized.toFixed(2)} €</span>
                {data.realizedCount > 0 && (
                  <span className="text-gray-400 ml-1">({data.realizedCount} mission{data.realizedCount > 1 ? 's' : ''})</span>
                )}
              </p>
            )}
            {data.forecast > 0 && (
              <p className="text-xs">
                <span className="text-blue-400">Prévisionnel:</span>{' '}
                <span className="font-semibold text-gray-100">{data.forecast.toFixed(2)} €</span>
                {data.forecastCount > 0 && (
                  <span className="text-gray-400 ml-1">({data.forecastCount} mission{data.forecastCount > 1 ? 's' : ''})</span>
                )}
              </p>
            )}
            {data.realized === 0 && data.forecast === 0 && (
              <p className="text-xs text-gray-400">Aucune donnée</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">Prévisions de revenus</h3>
        </div>
        <span className="text-xs md:text-sm text-gray-400">Projection 3 mois</span>
      </div>

      {/* Résumé des prévisions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Mois actuel - Réalisé */}
        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <p className="text-xs font-semibold text-green-300 uppercase tracking-wide">Mois actuel</p>
          </div>
          <p className="text-2xl font-black text-gray-100 mb-1">{currentMonthRealized.toFixed(0)} €</p>
          <p className="text-xs text-gray-400">Réalisé</p>
        </div>

        {/* Mois actuel - Prévisionnel */}
        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Mois actuel</p>
          </div>
          <p className="text-2xl font-black text-gray-100 mb-1">{currentMonthForecast.toFixed(0)} €</p>
          <p className="text-xs text-gray-400">Prévisionnel</p>
        </div>

        {/* Prochains mois */}
        <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide">2 prochains mois</p>
          </div>
          <p className="text-2xl font-black text-gray-100 mb-1">{nextMonthsForecast.toFixed(0)} €</p>
          <p className="text-xs text-gray-400">Prévisionnel</p>
        </div>
      </div>

      {/* Graphique de projection */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={forecastData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.2} />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af" 
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar 
              dataKey="realized" 
              name="Réalisé" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            <Bar 
              dataKey="forecast" 
              name="Prévisionnel" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparaison et analyse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Comparaison prévisionnel vs réalisé */}
        <div className="p-4 bg-dark-50 rounded-xl border border-dark-200">
          <p className="text-sm font-semibold text-gray-200 mb-3">Comparaison totale</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Réalisé (3 mois)</span>
              <span className="text-sm font-bold text-green-400">{totals.realized.toFixed(0)} €</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Prévisionnel (3 mois)</span>
              <span className="text-sm font-bold text-blue-400">{totals.forecast.toFixed(0)} €</span>
            </div>
            <div className="h-px bg-dark-200 my-2"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Écart</span>
              <span className={`text-sm font-bold ${totals.difference >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {totals.difference >= 0 ? '+' : ''}{totals.difference.toFixed(0)} €
              </span>
            </div>
            {totals.realized > 0 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-200">
                <span className="text-xs text-gray-400">Variation</span>
                <span className={`text-xs font-semibold ${totals.percentage >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                  {totals.percentage >= 0 ? '+' : ''}{totals.percentage.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Avertissement si pas de prévisions */}
        {totals.forecast === 0 && (
          <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-300 mb-1">Aucune mission planifiée</p>
              <p className="text-xs text-gray-400">
                Ajoutez des missions planifiées pour voir les prévisions de revenus.
              </p>
            </div>
          </div>
        )}

        {/* Info si prévisions disponibles */}
        {totals.forecast > 0 && (
          <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/30">
            <p className="text-sm font-semibold text-primary-300 mb-2">💡 Analyse</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {totals.difference > 0 ? (
                <>
                  Vos prévisions sont <span className="text-green-400 font-semibold">supérieures</span> aux revenus réalisés.
                  {totals.percentage > 20 && ' Excellente projection !'}
                </>
              ) : totals.difference < 0 ? (
                <>
                  Vos prévisions sont <span className="text-orange-400 font-semibold">inférieures</span> aux revenus réalisés.
                  {' '}Vous pourriez ajuster vos estimations.
                </>
              ) : (
                <>
                  Vos prévisions correspondent <span className="text-green-400 font-semibold">exactement</span> aux revenus réalisés.
                  {' '}Très bonne estimation !
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardForecast;

