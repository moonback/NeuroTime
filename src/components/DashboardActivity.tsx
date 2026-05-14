import React, { useMemo } from 'react';
import { Mission } from '../types';
import { Clock, CheckCircle, Calendar, Plus, Edit } from 'lucide-react';
import { format, isToday, isYesterday, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

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
      <div className="text-center py-8 text-gray-400">
        <p>Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentActivity.map((activity, index) => (
          <div
            key={activity.id}
            className="group relative p-4 glass-light rounded-xl border border-primary-500/10 hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 cursor-pointer overflow-hidden animate-slide-in-up backdrop-blur-md"
            onClick={() => onEdit(activity.mission)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              {/* Icon and Type */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg border ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                {activity.mission.status === 'completed' && activity.mission.totalEarnings && (
                  <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-1 rounded-md border border-green-500/30">
                    {activity.mission.totalEarnings.toFixed(0)}€
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h4 className="text-sm font-bold text-gray-200 mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors min-h-[2.5rem]">
                {activity.mission.title}
              </h4>
              
              {/* Label */}
              <p className="text-xs text-gray-400 mb-2 font-medium">
                {activity.label}
              </p>
              
              {/* Timestamp */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dark-200">
                <Clock className="w-3 h-3 text-gray-500" />
                <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default DashboardActivity;

