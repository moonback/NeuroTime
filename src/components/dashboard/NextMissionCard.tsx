import React from 'react';
import { Calendar, MapPin, Clock, Moon, Sun, Briefcase, Euro, Edit, CheckCircle, Navigation } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes, isToday, isTomorrow, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Mission } from '../../types';
import { formatTimeSlots } from '../../utils/timeSlots';
import { MissionTimer } from '../MissionTimer';

interface NextMissionCardProps {
  nextMission: Mission | null;
  onEdit: (mission: Mission) => void;
  onUpdate: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  hidePrices?: boolean;
}

const NextMissionCard: React.FC<NextMissionCardProps> = ({ nextMission, onEdit, onUpdate, onValidate, hidePrices = false }) => {
  
  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };

  if (!nextMission) {
    return (
      <div className="glass-card rounded-2xl p-5 border border-orange-500/20 bg-gradient-to-br from-orange-600/10 via-orange-500/5 to-orange-400/5 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200">
               <Calendar size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-100">Aucune mission planifiée</p>
              <p className="text-xs text-gray-500 font-medium">Ajoutez une mission pour commencer</p>
            </div>
         </div>
      </div>
    );
  }

  const missionStart = new Date(nextMission.startTime);
  const missionEnd = new Date(nextMission.endTime);
  const now = new Date();
  const isOngoing = now >= missionStart && now < missionEnd;

  // Calcul du temps restant compact
  let timeText = '';
  if (isOngoing) {
    const hoursLeft = differenceInHours(missionEnd, now);
    const minutesLeft = differenceInMinutes(missionEnd, now) % 60;
    timeText = hoursLeft === 0 ? `${minutesLeft} min rest.` : `${hoursLeft}h rest.`;
  } else {
    const hoursUntil = differenceInHours(missionStart, now);
    const minutesUntil = differenceInMinutes(missionStart, now);
    const daysUntil = differenceInCalendarDays(missionStart, now);

    if (minutesUntil < 60) timeText = `Dans ${minutesUntil} min`;
    else if (isToday(missionStart)) timeText = `Aujourd'hui +${hoursUntil}h`;
    else if (isTomorrow(missionStart)) timeText = 'Demain';
    else timeText = `Dans ${daysUntil}j`;
  }

  return (
    <div 
      onClick={() => onEdit(nextMission)}
      className="glass-card rounded-2xl p-4 md:p-5 border border-orange-500/20 bg-gradient-to-br from-orange-600/15 via-orange-500/10 to-orange-400/5 hover:from-orange-600/20 hover:via-orange-500/15 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center">
        
        {/* Date & Time Block - Compact */}
        <div className="flex-shrink-0 flex md:flex-col items-center gap-2 md:gap-1 bg-orange-500/10 border border-orange-500/20 rounded-xl p-2 md:p-3 min-w-[80px] md:min-w-[90px] text-center">
           <span className="text-[10px] uppercase font-bold text-orange-200 tracking-wider">
             {format(missionStart, 'MMM', { locale: fr })}
           </span>
           <span className="text-xl md:text-2xl font-black text-orange-50 leading-none">
             {format(missionStart, 'dd')}
           </span>
           <span className="text-xs font-bold text-orange-200 bg-orange-500/20 px-1.5 py-0.5 rounded-md mt-0.5">
             {format(missionStart, 'HH:mm')}
           </span>
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0 w-full">
           <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${isOngoing ? 'bg-orange-500 text-dark-300 border-orange-400 animate-pulse' : 'bg-orange-500/10 text-orange-200 border-orange-500/20'}`}>
                {isOngoing ? 'En cours' : timeText}
              </span>
              <div className="flex items-center gap-2">
                 <MissionTimer mission={nextMission} onUpdate={onUpdate} />
                 {/* Badges Type */}
                 <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    nextMission.rateType === 'night' 
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                      : nextMission.rateType === 'mixed'
                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                 }`}>
                    {nextMission.rateType === 'night' ? <Moon size={10} /> : nextMission.rateType === 'mixed' ? <Clock size={10} /> : <Sun size={10} />}
                    <span className="hidden sm:inline">{nextMission.rateType === 'night' ? 'Nuit' : nextMission.rateType === 'mixed' ? 'Mixte' : 'Jour'}</span>
                 </span>
                 
                 {!hidePrices && (
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {formatPrice(nextMission.totalEarnings)}€
                    </span>
                 )}
              </div>
           </div>

           <h3 className="text-lg md:text-xl font-black text-gray-50 truncate mb-1.5 leading-tight group-hover:text-orange-100 transition-colors">
             {nextMission.title}
           </h3>

           <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 font-medium">
              {nextMission.client && (
                 <div className="flex items-center gap-1.5 text-orange-200/80">
                    <Briefcase size={12} strokeWidth={2.5} />
                    <span>{nextMission.client}</span>
                 </div>
              )}
              <div className="flex items-center gap-1.5">
                 <Clock size={12} />
                 <span>{formatTimeSlots(nextMission)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <MapPin size={12} />
                 <span className="truncate max-w-[150px]">{nextMission.location}</span>
              </div>
           </div>
        </div>

        {/* Actions Rapides - Compact */}
        <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 md:pl-4">
           <button
             onClick={(e) => { e.stopPropagation(); onValidate(nextMission); }}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 transition-all text-xs font-bold"
           >
             <CheckCircle size={14} strokeWidth={2.5} />
             <span className="md:hidden lg:inline">Valider</span>
           </button>
           <button
             onClick={(e) => { e.stopPropagation(); onEdit(nextMission); }}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg glass-light hover:bg-white/10 text-gray-300 border border-white/10 transition-all text-xs font-bold"
           >
             <Edit size={14} strokeWidth={2.5} />
             <span className="md:hidden lg:inline">Modifier</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default NextMissionCard;

