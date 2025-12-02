import React, { useMemo } from 'react';
import { Mission } from '../types';
import { Clock, CheckCircle, Calendar, Plus, Edit } from 'lucide-react';
import { format, isToday, isYesterday, differenceInHours } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface DashboardActivityProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
}

interface ActivityItem {
  id: string;
  type: 'created' | 'completed' | 'updated';
  mission: Mission;
  timestamp: Date;
  label: string;
}

const DashboardActivity: React.FC<DashboardActivityProps> = ({ missions, onEdit }) => {
  const recentActivity = useMemo(() => {
    const activities: ActivityItem[] = [];

    missions.forEach(mission => {
      // Missions créées récemment (basé sur startTime comme proxy)
      const createdDate = new Date(mission.startTime);
      if (differenceInHours(new Date(), createdDate) < 168) { // 7 jours
        activities.push({
          id: `${mission.id}-created`,
          type: 'created',
          mission,
          timestamp: createdDate,
          label: 'Mission créée',
        });
      }

      // Missions complétées récemment
      if (mission.status === 'completed') {
        const completedDate = new Date(mission.endTime);
        if (differenceInHours(new Date(), completedDate) < 168) { // 7 jours
          activities.push({
            id: `${mission.id}-completed`,
            type: 'completed',
            mission,
            timestamp: completedDate,
            label: 'Mission terminée',
          });
        }
      }
    });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }, [missions]);

  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return `Aujourd'hui à ${format(date, 'HH:mm', { locale: fr })}`;
    }
    if (isYesterday(date)) {
      return `Hier à ${format(date, 'HH:mm', { locale: fr })}`;
    }
    return format(date, 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <Plus className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'updated':
        return <Edit className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'updated':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (recentActivity.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">Activité récente</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
          <Clock className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-100">Activité récente</h3>
      </div>

      <div className="space-y-3">
        {recentActivity.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors cursor-pointer group"
            onClick={() => onEdit(activity.mission)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)} flex-shrink-0`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-primary-300 transition-colors">
                  {activity.mission.title}
                </p>
                {activity.mission.status === 'completed' && activity.mission.totalEarnings && (
                  <span className="text-xs font-semibold text-green-400 flex-shrink-0">
                    {activity.mission.totalEarnings.toFixed(0)}€
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-1">{activity.label}</p>
              <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardActivity;

