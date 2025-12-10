import React, { useMemo } from 'react';
import { Mission } from '../types';
import { BarChart3, Clock, Calendar, Target } from 'lucide-react';
import { format, getDay, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface DashboardStatsProps {
  missions: Mission[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ missions }) => {
  const completedMissions = missions.filter(m => m.status === 'completed');

  // Durée moyenne des missions
  const averageDuration = useMemo(() => {
    if (completedMissions.length === 0) return 0;
    
    const totalHours = completedMissions.reduce((acc, m) => {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0);
    
    return totalHours / completedMissions.length;
  }, [completedMissions]);

  // Heures de pointe (jours de la semaine les plus travaillés)
  const peakDays = useMemo(() => {
    const dayCounts: Record<number, { count: number; hours: number }> = {};
    
    completedMissions.forEach(mission => {
      const day = getDay(new Date(mission.startTime));
      const start = new Date(mission.startTime).getTime();
      const end = new Date(mission.endTime).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      
      if (!dayCounts[day]) {
        dayCounts[day] = { count: 0, hours: 0 };
      }
      dayCounts[day].count += 1;
      dayCounts[day].hours += hours;
    });
    
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    return Object.entries(dayCounts)
      .map(([day, data]) => ({
        day: parseInt(day),
        dayName: dayNames[parseInt(day)],
        count: data.count,
        hours: Math.round(data.hours * 10) / 10,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 3);
  }, [completedMissions]);

  // Taux de complétion (missions terminées vs planifiées)
  const completionRate = useMemo(() => {
    const planned = missions.filter(m => m.status === 'planned').length;
    const completed = completedMissions.length;
    const total = planned + completed;
    
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [missions, completedMissions]);

  // Heures travaillées par semaine (4 dernières semaines)
  const weeklyHours = useMemo(() => {
    const now = new Date();
    const weeks = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      const weekMissions = completedMissions.filter(m => {
        const missionDate = new Date(m.startTime);
        return missionDate >= weekStart && missionDate <= weekEnd;
      });
      
      const hours = weekMissions.reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);
      
      weeks.push({
        week: `Sem. ${4 - i}`,
        hours: Math.round(hours * 10) / 10,
        count: weekMissions.length,
      });
    }
    
    return weeks;
  }, [completedMissions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Statistiques détaillées */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">Statistiques avancées</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 glass-light rounded-lg border border-gray-700/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-400" />
              <div>
                <p className="text-sm font-semibold text-gray-200">Durée moyenne</p>
                <p className="text-xs text-gray-400">Par mission</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-300">{averageDuration.toFixed(1)}h</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 glass-light rounded-lg border border-gray-700/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-gray-200">Taux de complétion</p>
                <p className="text-xs text-gray-400">Missions terminées</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-300">{completionRate}%</p>
            </div>
          </div>

          {peakDays.length > 0 && (
            <div className="p-3 glass-light rounded-lg border border-gray-700/30 backdrop-blur-sm">
              <p className="text-sm font-semibold text-gray-200 mb-3">Jours les plus actifs</p>
              <div className="space-y-2">
                {peakDays.map((day, index) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-6">#{index + 1}</span>
                      <span className="text-sm text-gray-300">{day.dayName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{day.count} mission{day.count > 1 ? 's' : ''}</span>
                      <span className="text-sm font-semibold text-purple-300">{day.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heures par semaine */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">Activité hebdomadaire</h3>
        </div>
        
        <div className="space-y-3">
          {weeklyHours.map((week, index) => {
            const maxHours = Math.max(...weeklyHours.map(w => w.hours), 1);
            const percentage = (week.hours / maxHours) * 100;
            
            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 font-medium">{week.week}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{week.count} mission{week.count > 1 ? 's' : ''}</span>
                    <span className="text-sm font-semibold text-blue-300">{week.hours}h</span>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;

