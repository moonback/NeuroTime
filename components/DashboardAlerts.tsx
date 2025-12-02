import React, { useMemo } from 'react';
import { Mission } from '../types';
import { AlertCircle, Clock, Calendar, CheckCircle, Bell } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface DashboardAlertsProps {
  missions: Mission[];
  onValidate: (mission: Mission) => void;
  onEdit: (mission: Mission) => void;
}

const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ missions, onValidate, onEdit }) => {
  // Missions planifiées à valider (passées ou aujourd'hui)
  const missionsToValidate = useMemo(() => {
    const now = new Date();
    return missions
      .filter(m => m.status === 'planned')
      .filter(m => {
        const missionDate = new Date(m.startTime);
        return missionDate <= now;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [missions]);

  // Missions à venir dans les 7 prochains jours
  const upcomingIn7Days = useMemo(() => {
    const now = new Date();
    const in7Days = addDays(now, 7);
    return missions
      .filter(m => m.status === 'planned')
      .filter(m => {
        const missionDate = new Date(m.startTime);
        return missionDate > now && missionDate <= in7Days;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [missions]);

  // Missions sans description
  const missionsWithoutDescription = useMemo(() => {
    return missions
      .filter(m => !m.description || m.description.trim() === '')
      .filter(m => m.status === 'planned' || m.status === 'completed')
      .slice(0, 3);
  }, [missions]);

  const hasAlerts = missionsToValidate.length > 0 || upcomingIn7Days.length > 0 || missionsWithoutDescription.length > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="bg-orange-500/20 p-2 rounded-lg border border-orange-500/30">
          <Bell className="w-5 h-5 text-orange-400" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-100">Alertes et rappels</h3>
      </div>

      <div className="space-y-4">
        {/* Missions à valider */}
        {missionsToValidate.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-semibold text-orange-300">
                {missionsToValidate.length} mission{missionsToValidate.length > 1 ? 's' : ''} à valider
              </h4>
            </div>
            <div className="space-y-2">
              {missionsToValidate.map((mission) => {
                const daysPast = differenceInDays(new Date(), new Date(mission.startTime));
                return (
                  <div
                    key={mission.id}
                    className="flex items-center justify-between p-2 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors cursor-pointer"
                    onClick={() => onEdit(mission)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{mission.title}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })} • 
                        {daysPast === 0 ? ' Aujourd\'hui' : ` Il y a ${daysPast} jour${daysPast > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onValidate(mission);
                      }}
                      className="ml-2 flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      <CheckCircle size={12} />
                      Valider
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missions à venir dans 7 jours */}
        {upcomingIn7Days.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-blue-300">
                {upcomingIn7Days.length} mission{upcomingIn7Days.length > 1 ? 's' : ''} à venir (7 jours)
              </h4>
            </div>
            <div className="space-y-2">
              {upcomingIn7Days.map((mission) => {
                const daysUntil = differenceInDays(new Date(mission.startTime), new Date());
                return (
                  <div
                    key={mission.id}
                    className="flex items-center justify-between p-2 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors cursor-pointer"
                    onClick={() => onEdit(mission)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{mission.title}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(mission.startTime), 'dd MMM yyyy à HH:mm', { locale: fr })} • 
                        {daysUntil === 0 ? ' Aujourd\'hui' : ` Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="ml-2 text-xs font-semibold text-blue-300">
                      {mission.totalEarnings?.toFixed(0) || 0}€
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missions sans description */}
        {missionsWithoutDescription.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <h4 className="text-sm font-semibold text-yellow-300">
                {missionsWithoutDescription.length} mission{missionsWithoutDescription.length > 1 ? 's' : ''} sans description
              </h4>
            </div>
            <div className="space-y-2">
              {missionsWithoutDescription.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center justify-between p-2 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors cursor-pointer"
                  onClick={() => onEdit(mission)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{mission.title}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <span className="ml-2 text-xs text-yellow-400">À compléter</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAlerts;

