import React, { useMemo } from 'react';
import { Mission } from '../types';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isThisMonth, isSameMonth } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { TrendingUp, Moon, Sun } from 'lucide-react';

interface DashboardChartsProps {
  missions: Mission[];
  selectedMonth?: Date;
}

const COLORS = ['#008CFF', '#76CCFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardCharts: React.FC<DashboardChartsProps> = ({ missions, selectedMonth }) => {
  // Données des revenus mensuels (6 derniers mois)
  const monthlyRevenue = useMemo(() => {
    const referenceDate = selectedMonth || new Date();
    const start = startOfMonth(subMonths(referenceDate, 5));
    const months = eachMonthOfInterval({ start, end: referenceDate });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthMissions = missions
        .filter(m => m.status === 'completed')
        .filter(m => {
          const missionDate = new Date(m.endTime);
          return missionDate >= monthStart && missionDate <= monthEnd;
        });
      
      const revenue = monthMissions.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);
      const count = monthMissions.length;
      
      return {
        month: format(monthStart, 'MMM', { locale: fr }),
        monthFull: format(monthStart, 'MMM yyyy', { locale: fr }),
        revenue: Math.round(revenue * 100) / 100,
        count,
      };
    });
  }, [missions, selectedMonth]);

  // Répartition jour/nuit (pour le mois sélectionné)
  const dayNightDistribution = useMemo(() => {
    const referenceDate = selectedMonth || new Date();
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);
    
    const completedMissions = missions
      .filter(m => m.status === 'completed')
      .filter(m => {
        const missionDate = new Date(m.endTime);
        return missionDate >= monthStart && missionDate <= monthEnd;
      });
    
    const dayHours = completedMissions
      .filter(m => m.rateType === 'day')
      .reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);
    
    const nightHours = completedMissions
      .filter(m => m.rateType === 'night')
      .reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);
    
    const mixedHours = completedMissions
      .filter(m => m.rateType === 'mixed')
      .reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);

    const total = dayHours + nightHours + mixedHours;
    
    if (total === 0) {
      return [
        { name: 'Jour', value: 0, hours: 0, percentage: 0 },
        { name: 'Nuit', value: 0, hours: 0, percentage: 0 },
        { name: 'Mixte', value: 0, hours: 0, percentage: 0 },
      ];
    }

    return [
      { 
        name: 'Jour', 
        value: Math.round((dayHours / total) * 100), 
        hours: Math.round(dayHours * 10) / 10,
        percentage: Math.round((dayHours / total) * 100)
      },
      { 
        name: 'Nuit', 
        value: Math.round((nightHours / total) * 100), 
        hours: Math.round(nightHours * 10) / 10,
        percentage: Math.round((nightHours / total) * 100)
      },
      { 
        name: 'Mixte', 
        value: Math.round((mixedHours / total) * 100), 
        hours: Math.round(mixedHours * 10) / 10,
        percentage: Math.round((mixedHours / total) * 100)
      },
    ].filter(item => item.hours > 0);
  }, [missions, selectedMonth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-primary-500/30 rounded-lg">
          <p className="text-sm font-semibold text-gray-200 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value.toFixed(2)} €</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 border border-primary-500/30 rounded-lg">
          <p className="text-sm font-semibold text-gray-200 mb-1">{data.name}</p>
          <p className="text-xs text-gray-300">
            {data.hours}h ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Graphique de revenus mensuels */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary-500/20 p-2 rounded-lg border border-primary-500/30">
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-100">Évolution des revenus</h3>
          </div>
          <span className="text-xs md:text-sm text-gray-400">6 derniers mois</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#008CFF" 
              strokeWidth={3}
              dot={{ fill: '#008CFF', r: 5 }}
              activeDot={{ r: 7, fill: '#76CCFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition jour/nuit */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
            <Moon className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">Répartition jour/nuit</h3>
        </div>
        {dayNightDistribution.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dayNightDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dayNightDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {dayNightDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">{item.hours}h</span>
                    <span className="text-primary-300 font-semibold">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-gray-400">
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;

