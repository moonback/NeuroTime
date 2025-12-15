import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, CheckCircle, Clock, MapPin, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Mission } from '../../types';

interface UpcomingMissionsListProps {
  upcomingMissions: Mission[];
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  hidePrices?: boolean;
}

const UpcomingMissionsList: React.FC<UpcomingMissionsListProps> = ({ upcomingMissions, onEdit, onValidate, hidePrices = false }) => {
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false);

  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
      <button
        onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
        className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <span className="bg-dark-100 p-2 rounded-lg border border-dark-200 group-hover:border-primary-500/50 transition-colors">
             <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-400" />
          </span>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">À venir</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs md:text-sm text-gray-300 font-medium bg-dark-100 px-2.5 py-1 rounded-full border border-dark-200">
            {upcomingMissions.length} en attente
          </span>
          <span className="text-xs md:text-sm text-gray-400">
            {isUpcomingExpanded ? 'Réduire' : 'Déplier'}
          </span>
          {isUpcomingExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {isUpcomingExpanded && (
        <div className="animate-slide-in-up">
          {upcomingMissions.length === 0 ? (
            <div className="text-center py-10 md:py-12 glass-light rounded-xl border border-dashed border-primary-500/20">
              <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-dark-50 rounded-full flex items-center justify-center shadow-sm mb-3 border border-dark-200">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <p className="text-gray-300 font-medium text-sm md:text-base">Tout est à jour !</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Aucune mission en attente</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {upcomingMissions.map((mission, index) => (
                <div key={mission.id} className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl glass-light hover:border-primary-500/30 hover:shadow-lg transition-all duration-200 animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  
                  {/* Date Badge */}
                  <div 
                    onClick={() => onEdit(mission)}
                    className="flex cursor-pointer md:flex-col items-center gap-2 md:gap-0 bg-dark-50 p-2.5 md:p-3 rounded-lg min-w-[70px] md:min-w-[80px] text-center border border-dark-200 group-hover:bg-primary-500/20 group-hover:border-primary-500/50 transition-all duration-300 shadow-sm relative z-10 group-hover:scale-105"
                  >
                    <div className="text-[10px] md:text-xs text-gray-400 group-hover:text-primary-300 uppercase font-bold tracking-wider">
                      {format(new Date(mission.startTime), 'MMM', { locale: fr })}
                    </div>
                    <div className="text-xl md:text-2xl font-black text-gray-100 group-hover:text-primary-300 leading-none md:mt-1">
                      {format(new Date(mission.startTime), 'dd')}
                    </div>
                    <div className="md:hidden h-6 w-[1px] bg-dark-200 mx-2"></div>
                    <div className="md:hidden text-base font-bold text-gray-200">
                       {format(new Date(mission.startTime), 'HH:mm')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(mission)}>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-gray-100 text-base md:text-lg truncate group-hover:text-primary-300 transition-colors">{mission.title}</h4>
                      {!hidePrices && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex-shrink-0">
                          {formatPrice(mission.totalEarnings)}€
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-y-1.5 gap-x-3 mt-2 text-xs md:text-sm text-gray-400">
                      <span className="flex items-center gap-1.5 bg-dark-50 px-2 py-0.5 rounded-md border border-dark-200">
                        <Clock size={12} className="text-gray-500" />
                        {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-500" />
                        <span className="truncate max-w-[150px]">{mission.location}</span>
                      </span>
                       <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium">
                         {mission.rateType === 'night' ? <Moon size={10} className="text-primary-400" /> : <Sun size={10} className="text-orange-400" />}
                         {mission.rateType === 'night' ? 'Nuit' : 'Jour'}
                       </span>
                    </div>
                  </div>

                  {/* Action: Validate */}
                  <div className="flex items-center justify-end md:justify-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onValidate(mission);
                      }}
                      className="flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg font-semibold text-xs md:text-sm transition-all shadow-sm"
                      title="Valider les heures"
                    >
                      <CheckCircle size={14} />
                      <span className="hidden lg:inline">Valider</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingMissionsList;

