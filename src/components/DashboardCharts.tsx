import React, { useMemo } from 'react';
import { Mission } from '../types';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isThisMonth, isSameMonth } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { TrendingUp, Moon, Sun } from 'lucide-react';
import { calculateEarnings } from '../utils/calculations';

interface DashboardChartsProps {
  missions: Mission[];
  selectedMonth?: Date;
}

const COLORS = {
  day: '#f59e0b', // Amber-500
  night: '#6366f1', // Indigo-500
};

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
    
    let totalDayHours = 0;
    let totalNightHours = 0;

    completedMissions.forEach(m => {
      if (m.details) {
        // Use pre-calculated details if available
        totalDayHours += m.details.dayHours || 0;
        totalNightHours += m.details.nightHours || 0;
      } else {
        // Fallback calculation
        try {
          // Extract HH:mm from ISO strings if possible, otherwise use full date objects
          // Mission dates are ISO strings. We need to respect the day/night calc logic.
          const dateStr = format(new Date(m.startTime), 'yyyy-MM-dd');
          const startTime = format(new Date(m.startTime), 'HH:mm');
          const endTime = format(new Date(m.endTime), 'HH:mm');
          
          const details = calculateEarnings(dateStr, startTime, endTime);
          totalDayHours += details.dayHours;
          totalNightHours += details.nightHours;
        } catch (e) {
          console.warn('Could not calculate hours for mission', m.id, e);
          // Rough fallback based on time difference (assuming day if failed)
          const start = new Date(m.startTime).getTime();
          const end = new Date(m.endTime).getTime();
          totalDayHours += (end - start) / (1000 * 60 * 60);
        }
      }
    });
    
    const total = totalDayHours + totalNightHours;
    
    if (total === 0) {
      return [];
    }

    return [
      { 
        name: 'Heures Jour', 
        value: totalDayHours, 
        hours: Math.round(totalDayHours * 10) / 10,
        percentage: Math.round((totalDayHours / total) * 100),
        fill: COLORS.day
      },
      { 
        name: 'Heures Nuit', 
        value: totalNightHours, 
        hours: Math.round(totalNightHours * 10) / 10,
        percentage: Math.round((totalNightHours / total) * 100),
        fill: COLORS.night
      }
    ].filter(item => item.value > 0);
  }, [missions, selectedMonth]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-primary-500/30 rounded-lg shadow-xl backdrop-blur-md bg-dark-200/90">
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
        <div className="glass-card p-3 border border-primary-500/30 rounded-lg shadow-xl backdrop-blur-md bg-dark-200/90">
          <div className="flex items-center gap-2 mb-1">
             {data.name === 'Heures Jour' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-500" />}
             <p className="text-sm font-semibold text-gray-200">{data.name}</p>
          </div>
          <p className="text-xs text-gray-300">
            {data.hours}h ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.1} vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af" 
              style={{ fontSize: '12px' }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#9ca3af" 
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}€`}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#008CFF" 
              strokeWidth={3}
              dot={{ fill: '#008CFF', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#76CCFF', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Répartition jour/nuit */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up delay-100">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
            <Moon className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">Répartition Jour / Nuit</h3>
        </div>
        {dayNightDistribution.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-[200px] h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={dayNightDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {dayNightDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-100">
                        {Math.round((dayNightDistribution.reduce((acc, curr) => acc + curr.value, 0)) * 10) / 10}h
                    </span>
                    <span className="text-xs text-gray-400">Total</span>
                </div>
            </div>

            <div className="flex flex-col gap-4 w-full sm:w-auto">
              {dayNightDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between sm:justify-start gap-4 p-3 rounded-xl bg-dark-300/30 border border-white/5 w-full sm:w-[180px]">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg" 
                      style={{ backgroundColor: `${item.fill}20`, color: item.fill }}
                    >
                      {item.name === 'Heures Jour' ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-300">{item.name === 'Heures Jour' ? 'Jour' : 'Nuit'}</span>
                        <span className="text-lg font-bold text-gray-100">{item.hours}h</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-gray-400 bg-dark-400/50 px-1.5 py-0.5 rounded">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-gray-400 gap-3">
            <Moon className="w-12 h-12 text-gray-600 opacity-50" />
            <p>Aucune donnée pour cette période</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;

