import React, { useMemo } from 'react';
import { Mission } from '../types';
import { BarChart3, Clock, Calendar, Target } from 'lucide-react';
import { format, getDay, startOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface DashboardStatsProps {
  missions: Mission[];
  selectedMonth?: Date;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ missions, selectedMonth }) => {
  const referenceDate = selectedMonth || new Date();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const completedMissions = useMemo(() => {
    const monthStartTime = monthStart.getTime();
    const monthEndTime = monthEnd.getTime();

    return missions.filter(m => {
      if (m.status !== 'completed' || m.rateType === 'custom') return false;
      const missionEndTime = new Date(m.endTime).getTime();
      return missionEndTime >= monthStartTime && missionEndTime <= monthEndTime;
    });
  }, [missions, monthStart, monthEnd]);

  const averageDuration = useMemo(() => {
    if (completedMissions.length === 0) return 0;
    let totalHours = 0;
    for (const m of completedMissions) {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      totalHours += (end - start) / (1000 * 60 * 60);
    }
    return Math.round((totalHours / completedMissions.length) * 10) / 10;
  }, [completedMissions]);

  const peakDays = useMemo(() => {
    const dayCounts: Record<number, { count: number; hours: number }> = {};
    for (const mission of completedMissions) {
      const day = getDay(new Date(mission.startTime));
      const start = new Date(mission.startTime).getTime();
      const end = new Date(mission.endTime).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      if (!dayCounts[day]) dayCounts[day] = { count: 0, hours: 0 };
      dayCounts[day].count += 1;
      dayCounts[day].hours += hours;
    }
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
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

  const completionRate = useMemo(() => {
    const monthStartTime = monthStart.getTime();
    const monthEndTime = monthEnd.getTime();
    let planned = 0;
    for (const m of missions) {
      if (m.status === 'planned') {
        const missionStartTime = new Date(m.startTime).getTime();
        if (missionStartTime >= monthStartTime && missionStartTime <= monthEndTime) planned++;
      }
    }
    const completed = completedMissions.length;
    const total = planned + completed;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [missions, completedMissions, monthStart, monthEnd]);

  const weeklyHours = useMemo(() => {
    const weeks = [];
    const monthStartWeek = startOfWeek(monthStart, { weekStartsOn: 1 });
    const monthEndWeek = startOfWeek(monthEnd, { weekStartsOn: 1 });
    let currentWeek = monthStartWeek;
    let weekIndex = 1;

    while (currentWeek <= monthEndWeek) {
      const weekStartTime = currentWeek.getTime();
      const weekEndTime = weekStartTime + 6 * 24 * 60 * 60 * 1000;
      let hours = 0;
      let count = 0;

      for (const m of completedMissions) {
        const missionStartTime = new Date(m.startTime).getTime();
        if (missionStartTime >= weekStartTime && missionStartTime <= weekEndTime) {
          count++;
          hours += (new Date(m.endTime).getTime() - missionStartTime) / (1000 * 60 * 60);
        }
      }

      weeks.push({
        week: `S${weekIndex}`,
        hours: Math.round(hours * 10) / 10,
        count,
      });

      currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      weekIndex++;
    }
    return weeks;
  }, [completedMissions, monthStart, monthEnd]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Statistiques détaillées */}
      <div className="glass-card rounded-xl p-3.5 md:p-4 animate-slide-in-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20">
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h3 className="text-xs font-bold text-gray-200">Statistiques avancées</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <p className="text-[11px] font-semibold text-gray-200">Durée moyenne</p>
                <p className="text-[9px] text-gray-500">Par mission</p>
              </div>
            </div>
            <p className="num-financial text-sm font-bold text-indigo-300">{averageDuration.toFixed(1)}h</p>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <p className="text-[11px] font-semibold text-gray-200">Taux complétion</p>
                <p className="text-[9px] text-gray-500">Missions terminées</p>
              </div>
            </div>
            <p className="text-sm font-bold text-emerald-300">{completionRate}%</p>
          </div>

          {peakDays.length > 0 && (
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              <p className="text-[10px] font-semibold text-gray-300 mb-2">Jours actifs</p>
              <div className="space-y-1.5">
                {peakDays.map((day, index) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-gray-500 w-4">#{index + 1}</span>
                      <span className="text-[10px] text-gray-300">{day.dayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500">{day.count} mission{day.count > 1 ? 's' : ''}</span>
                      <span className="text-[10px] font-bold text-purple-300">{day.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heures par semaine */}
      <div className="glass-card rounded-xl p-3.5 md:p-4 animate-slide-in-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h3 className="text-xs font-bold text-gray-200">Activité hebdomadaire</h3>
        </div>

        <div className="space-y-2.5">
          {weeklyHours.map((week, index) => {
            const maxHours = Math.max(...weeklyHours.map(w => w.hours), 1);
            const percentage = (week.hours / maxHours) * 100;

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">{week.week}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500">{week.count} m.</span>
                    <span className="text-[11px] font-bold text-blue-300">{week.hours}h</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500/70 to-indigo-500/70 rounded-full transition-all duration-500"
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
