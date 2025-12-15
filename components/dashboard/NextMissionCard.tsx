import React from 'react';
import { Calendar, MapPin, Clock, Moon, Sun, Briefcase, Euro, Edit, CheckCircle } from 'lucide-react';
import { format, differenceInHours, differenceInDays, differenceInMinutes, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Mission } from '../../types';
import { formatTimeSlots } from '../../utils/timeSlots';

interface NextMissionCardProps {
  nextMission: Mission | null;
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  hidePrices?: boolean;
}

const NextMissionCard: React.FC<NextMissionCardProps> = ({ nextMission, onEdit, onValidate, hidePrices = false }) => {
  
  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };

  if (!nextMission) {
    return (
      <div className="glass-card rounded-2xl p-5 md:p-6 border border-orange-500/20 bg-gradient-to-br from-orange-600/18 via-orange-500/12 to-orange-400/8 hover:from-orange-600/22 hover:via-orange-500/18 hover:to-orange-400/12 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 shadow-md shadow-orange-500/15">
              <Calendar className="w-5 h-5 text-orange-200" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-semibold text-orange-100 tracking-wide">Prochaine mission</p>
          </div>
          <span className="text-xs text-gray-400">—</span>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 font-medium mb-2">Aucune mission planifiée</p>
          <p className="text-xs text-gray-500">Ajoutez une nouvelle mission pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onEdit(nextMission)}
      className="glass-card rounded-2xl p-5 md:p-6 border border-orange-500/20 bg-gradient-to-br from-orange-600/18 via-orange-500/12 to-orange-400/8 hover:from-orange-600/22 hover:via-orange-500/18 hover:to-orange-400/12 transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      
      <div className="relative z-10">
        {/* Header avec icône et temps restant */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 shadow-md shadow-orange-500/15 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-orange-200" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-100 tracking-wide mb-1">Prochaine mission</p>
              {(() => {
                const missionStart = new Date(nextMission.startTime);
                const now = new Date();
                const hoursUntil = differenceInHours(missionStart, now);
                const daysUntil = differenceInDays(missionStart, now);
                const minutesUntil = differenceInMinutes(missionStart, now);
                
                let timeText = '';
                if (minutesUntil < 60) {
                  timeText = `Dans ${minutesUntil} min`;
                } else if (hoursUntil < 24) {
                  timeText = isToday(missionStart) ? `Aujourd'hui dans ${hoursUntil}h` : `Dans ${hoursUntil}h`;
                } else if (daysUntil === 1 || isTomorrow(missionStart)) {
                  timeText = 'Demain';
                } else {
                  timeText = `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;
                }
                
                return (
                  <p className={`text-xs font-medium ${
                    hoursUntil < 24 ? 'text-orange-300' : 'text-orange-200/80'
                  }`}>
                    {timeText}
                  </p>
                );
              })()}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-medium text-orange-100 bg-orange-500/20 border border-orange-500/40 px-2.5 py-1 rounded-full shadow-sm">
              {format(new Date(nextMission.startTime), 'dd MMM yyyy', { locale: fr })}
            </span>
            <span className="text-xs font-bold text-orange-300 bg-orange-500/30 border border-orange-500/50 px-2.5 py-1 rounded-full">
              {format(new Date(nextMission.startTime), 'HH:mm', { locale: fr })}
            </span>
          </div>
        </div>

        {/* Titre de la mission */}
        <h3 className="text-xl md:text-2xl font-black text-gray-50 line-clamp-2 tracking-tight mb-4 group-hover:text-orange-100 transition-colors">
          {nextMission.title}
        </h3>

        {/* Informations détaillées */}
        <div className="space-y-3 mb-4">
          {/* Client */}
          {nextMission.client && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase size={14} className="text-orange-300/80" strokeWidth={2} />
              <span className="text-gray-200 font-medium">{nextMission.client}</span>
            </div>
          )}

          {/* Lieu et horaires */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} className="text-gray-400" strokeWidth={2} />
              <span className="font-medium">{nextMission.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={14} className="text-gray-400" strokeWidth={2} />
              <span className="font-medium">
                {formatTimeSlots(nextMission)}
              </span>
            </div>
          </div>

          {/* Badges Type et Montant */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
              nextMission.rateType === 'night' 
                ? 'bg-primary-500/20 text-primary-300 border-primary-500/40' 
                : nextMission.rateType === 'mixed'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
            }`}>
              {nextMission.rateType === 'night' ? (
                <>
                  <Moon size={12} />
                  Mission de nuit
                </>
              ) : nextMission.rateType === 'mixed' ? (
                <>
                  <Clock size={12} />
                  Mission mixte
                </>
              ) : (
                <>
                  <Sun size={12} />
                  Mission de jour
                </>
              )}
            </span>
            {!hidePrices && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Euro size={12} strokeWidth={2.5} />
                {formatPrice(nextMission.totalEarnings)}€
              </span>
            )}
          </div>

          {/* Description si disponible */}
          {nextMission.description && (
            <p className="text-xs text-gray-400 line-clamp-2 italic">
              {nextMission.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-orange-500/20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(nextMission);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 transition-all group-hover:border-orange-500/60"
          >
            <Edit size={14} />
            Modifier
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onValidate(nextMission);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-500/40 transition-all group-hover:border-green-500/60 ml-auto"
          >
            <CheckCircle size={14} />
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextMissionCard;

