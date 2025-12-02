import React, { useMemo } from 'react';
import { Mission } from '../types';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isThisMonth } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { TrendingUp, Users, Moon, Sun } from 'lucide-react';

interface DashboardChartsProps {
  missions: Mission[];
}

const COLORS = ['#008CFF', '#76CCFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardCharts: React.FC<DashboardChartsProps> = ({ missions }) => {
  // Données des revenus mensuels (6 derniers mois)
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, 5));
    const months = eachMonthOfInterval({ start, end: now });
    
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
  }, [missions]);

  // Répartition jour/nuit
  const dayNightDistribution = useMemo(() => {
    const completedMissions = missions.filter(m => m.status === 'completed');
    
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
  }, [missions]);

  // Top 5 clients par revenus
  const topClients = useMemo(() => {
    const completedMissions = missions.filter(m => m.status === 'completed');
    
    const clientMap = new Map<string, { revenue: number; count: number }>();
    
    completedMissions.forEach(mission => {
      const existing = clientMap.get(mission.client) || { revenue: 0, count: 0 };
      clientMap.set(mission.client, {
        revenue: existing.revenue + (mission.totalEarnings || 0),
        count: existing.count + 1,
      });
    });
    
    return Array.from(clientMap.entries())
      .map(([client, data]) => ({
        client,
        revenue: Math.round(data.revenue * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [missions]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Top clients */}
        <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-100">Top 5 clients</h3>
          </div>
          {topClients.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topClients} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.2} />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis 
                    dataKey="client" 
                    type="category" 
                    width={100} 
                    stroke="#9ca3af" 
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} €`, 'Revenus']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="text-gray-300 truncate max-w-[150px]">{client.client}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">{client.count} mission{client.count > 1 ? 's' : ''}</span>
                      <span className="text-emerald-400 font-semibold">{client.revenue.toFixed(0)}€</span>
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
    </div>
  );
};

export default DashboardCharts;

