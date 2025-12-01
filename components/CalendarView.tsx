import React, { useState, useMemo } from 'react';
import { Mission } from '../types';
import { 
  format, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  endOfWeek, 
  isSameMonth, 
  isToday
} from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import fr from 'date-fns/locale/fr';
import { ChevronLeft, ChevronRight, MapPin, Trash2, Edit, Calendar, CheckCircle, Plus, Briefcase, Clock, Euro, Filter, Truck } from 'lucide-react';

interface CalendarViewProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
  onValidate: (mission: Mission) => void;
  onNewMission: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ missions, onEdit, onDelete, onValidate, onNewMission }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'completed'>('all');

  // Optimize mission lookup by date (O(1) access) with correct Local Time parsing
  const missionsByDate = useMemo(() => {
    const map = new Map<string, Mission[]>();
    missions.forEach(m => {
      // Parse ISO string to local Date object to ensure it appears on the correct local day
      const dateObj = new Date(m.startTime);
      const dateKey = format(dateObj, 'yyyy-MM-dd');
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(m);
    });
    
    // Sort missions by time for each day
    map.forEach((dayMissions) => {
      dayMissions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    
    return map;
  }, [missions]);

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => eachDayOfInterval({
    start: startDate,
    end: endDate,
  }), [startDate, endDate]);

  // Calculate Month Stats
  const currentMonthMissions = missions.filter(m => isSameMonth(new Date(m.startTime), currentMonth));
  const monthRevenue = currentMonthMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
  const monthHours = currentMonthMissions.reduce((acc, m) => {
    const d = (m.details?.dayHours || 0) + (m.details?.nightHours || 0);
    return acc + d;
  }, 0);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  // Get missions for the currently selected single date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const allMissionsForDate = missionsByDate.get(selectedDateKey) || [];
  
  // Filter side panel list
  const selectedMissions = allMissionsForDate.filter(m => 
    filterStatus === 'all' || m.status === filterStatus
  );

  const dailyTotal = selectedMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-full pb-24 md:pb-0 animate-fade-in">
      {/* Calendar Main Panel */}
      <div className="flex-1 bg-dark-50 rounded-2xl shadow-sm border border-dark-100 p-4 md:p-5 lg:p-6 flex flex-col">
        
        {/* Header with Navigation & Stats */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4">
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
             <div className="flex gap-0.5 bg-dark-100 p-0.5 rounded-lg border border-dark-200">
              <button onClick={prevMonth} className="p-1.5 hover:bg-dark-200 hover:shadow-sm rounded-md transition-all text-gray-300">
                <ChevronLeft size={18} />
              </button>
              <button onClick={goToToday} className="px-2.5 py-1.5 text-[10px] md:text-xs font-bold text-gray-300 hover:bg-dark-200 hover:shadow-sm rounded-md transition-all">
                Aujourd'hui
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-dark-200 hover:shadow-sm rounded-md transition-all text-gray-300">
                <ChevronRight size={18} />
              </button>
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-100 capitalize truncate">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm w-full md:w-auto">
             <div className="flex-1 md:flex-none px-2.5 py-1.5 bg-primary-500/20 text-primary-300 rounded-lg font-medium border border-primary-500/30 flex items-center justify-center gap-1.5">
                <Clock size={14} />
                <span>{monthHours.toFixed(0)}h</span>
             </div>
             <div className="flex-1 md:flex-none px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5">
                <Euro size={14} />
                <span>{monthRevenue.toFixed(0)}€</span>
             </div>
             
             {/* Filter Toggle */}
             <div className="hidden md:flex bg-dark-100 rounded-lg p-0.5 border border-dark-200">
               <button 
                onClick={() => setFilterStatus(filterStatus === 'all' ? 'planned' : 'all')}
                className={`p-1.5 rounded-md transition-all ${filterStatus !== 'all' ? 'bg-dark-200 shadow-sm text-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
                title="Filtrer"
               >
                 <Filter size={14} />
               </button>
             </div>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-1.5 border-b border-dark-200 pb-1.5">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-[9px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 grid-rows-6 gap-px bg-dark-100 border border-dark-200 rounded-lg overflow-hidden flex-1 min-h-[400px] md:min-h-[450px]">
          {calendarDays.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayMissions = missionsByDate.get(dateKey) || [];
            
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isTodayDate = isToday(date);
            const hasMissions = dayMissions.length > 0;
            
            // Calculate day total for heatmap badge
            const dayRevenue = dayMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDate(date)}
                onDoubleClick={() => onNewMission(dateKey)}
                className={`
                  relative p-1 md:p-1.5 flex flex-col transition-all duration-200 cursor-pointer select-none bg-dark-50 hover:bg-dark-100
                  ${!isCurrentMonth ? 'bg-dark-100/30 text-gray-500' : ''}
                  ${isSelected ? 'bg-primary-500/20 inset-0' : ''}
                `}
              >
                {/* Header of the cell */}
                <div className="flex justify-between items-center mb-1">
                   <span className={`text-xs md:text-sm w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-all ${
                     isTodayDate 
                      ? 'bg-primary-500 text-dark-300 font-bold shadow-md scale-105' 
                      : isSelected ? 'bg-primary-500/30 text-primary-300 font-bold' : 'font-medium text-gray-200'
                   }`}>
                      {format(date, 'd')}
                   </span>
                   
                   {/* Mini revenue badge on desktop */}
                   {hasMissions && dayRevenue > 0 && isCurrentMonth && (
                     <span className="hidden lg:block text-[9px] font-semibold text-emerald-300 bg-emerald-500/20 px-1 rounded-md border border-emerald-500/30">
                       {Math.round(dayRevenue)}€
                     </span>
                   )}
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                  {/* Mobile Dots */}
                  <div className="md:hidden flex gap-1 justify-center mt-1 flex-wrap">
                    {dayMissions.slice(0, 4).map(m => (
                      <div key={m.id} className={`w-1.5 h-1.5 rounded-full ${
                        m.status === 'completed' ? 'bg-green-500' : 
                        m.status === 'cancelled' ? 'bg-red-300' : 'bg-blue-400'
                      }`} />
                    ))}
                  </div>

                  {/* Desktop Event Badges */}
                  <div className="hidden md:flex flex-col gap-1">
                    {dayMissions.slice(0, 3).map((m) => (
                      <div 
                        key={m.id} 
                        onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                        className={`
                          group flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border truncate cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm
                          ${m.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:border-green-500/50' : 
                            m.status === 'planned' ? 'bg-primary-500/20 text-primary-300 border-primary-500/30 hover:border-primary-500/50' : 
                            'bg-red-500/20 text-red-300 border-red-500/30 hover:border-red-500/50'}
                        `}
                        title={`${m.title} (${format(new Date(m.startTime), 'HH:mm')})`}
                      >
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${
                          m.status === 'completed' ? 'bg-green-400' : m.status === 'planned' ? 'bg-primary-400' : 'bg-red-400'
                        }`} />
                        <span className="font-bold opacity-75">{format(new Date(m.startTime), 'HH:mm')}</span>
                        <span className="truncate font-medium">{m.title}</span>
                      </div>
                    ))}
                    {dayMissions.length > 3 && (
                      <span className="text-[9px] text-gray-500 pl-1 font-medium">
                        + {dayMissions.length - 3} autres
                      </span>
                    )}
                  </div>
                </div>
                
                {isSelected && (
                   <div className="absolute inset-0 border-2 border-primary-400 rounded-lg pointer-events-none opacity-50"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-80 xl:w-96 bg-dark-50 rounded-2xl shadow-sm border border-dark-100 p-4 md:p-5 flex flex-col h-auto">
        <div className="mb-4 md:mb-6 border-b border-dark-200 pb-3 md:pb-4">
           <div className="flex justify-between items-center mb-3 md:mb-4">
             <div>
                <h3 className="text-base md:text-lg font-bold text-gray-100 capitalize leading-tight">
                  {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 capitalize">{format(selectedDate, 'yyyy')}</p>
             </div>
             <button 
              onClick={() => onNewMission(selectedDateKey)}
              className="p-2 bg-primary-500 text-dark-300 rounded-lg hover:bg-primary-400 shadow-md shadow-primary-500/30 transition-all"
              title="Ajouter une mission"
             >
               <Plus size={18} />
             </button>
           </div>
           
           {selectedMissions.length > 0 && (
             <div className="flex gap-2 md:gap-3 mt-3 md:mt-4">
               <div className="flex-1 bg-dark-100 p-2 md:p-2.5 rounded-lg border border-dark-200 flex flex-col items-center">
                 <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">Revenu</span>
                 <p className="text-base md:text-lg font-bold text-gray-100">{dailyTotal.toFixed(0)}€</p>
               </div>
               <div className="flex-1 bg-dark-100 p-2 md:p-2.5 rounded-lg border border-dark-200 flex flex-col items-center">
                 <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">Missions</span>
                 <p className="text-base md:text-lg font-bold text-gray-100">{selectedMissions.length}</p>
               </div>
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 md:space-y-3 pr-1 custom-scrollbar min-h-[250px] md:min-h-[300px]">
          {selectedMissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 opacity-60 py-8 md:py-10">
              <div className="bg-dark-100 p-3 md:p-4 rounded-full border border-dark-200">
                <Calendar size={28} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="font-medium text-xs md:text-sm text-gray-400">Aucune activité</p>
                <button 
                  onClick={() => onNewMission(selectedDateKey)} 
                  className="text-primary-400 font-bold text-[10px] md:text-xs mt-2 hover:underline uppercase tracking-wide"
                >
                  Créer une mission
                </button>
              </div>
            </div>
          ) : (
            selectedMissions.map(mission => (
              <div 
                key={mission.id} 
                className="group relative bg-dark-100 rounded-lg p-2.5 md:p-3 border border-dark-200 shadow-sm hover:shadow-md hover:border-primary-500/50 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-start gap-2 overflow-hidden">
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${mission.status === 'completed' ? 'bg-green-400' : mission.status === 'planned' ? 'bg-primary-400' : 'bg-red-400'}`}></span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-100 text-sm truncate">{mission.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 font-medium">
                          <Clock size={10} />
                          {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                        </div>
                      </div>
                   </div>
                   <span className="font-bold text-xs text-gray-200 bg-dark-50 px-1.5 py-0.5 rounded border border-dark-200">
                    {mission.totalEarnings?.toFixed(0)}€
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 pl-4 mb-2">
                   <Briefcase size={12} className="text-gray-500" />
                   <span className="truncate">{mission.client}</span>
                </div>

                {/* Logistics Info in Side Panel */}
                {(mission.logistics?.deliveryTime || mission.logistics?.pickupTime) && (
                  <div className="mb-2 pl-4 text-[10px] text-gray-500 space-y-1">
                    {mission.logistics.deliveryTime && (
                       <div className="flex items-center gap-1">
                         <Truck size={10} className="text-primary-400" />
                         <span>Liv: {format(new Date(mission.logistics.deliveryTime), 'dd/MM HH:mm')}</span>
                       </div>
                    )}
                     {mission.logistics.pickupTime && (
                       <div className="flex items-center gap-1">
                         <Truck size={10} className="text-orange-400" />
                         <span>Rep: {format(new Date(mission.logistics.pickupTime), 'dd/MM HH:mm')}</span>
                       </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end gap-1 pt-2 border-t border-dark-200">
                   {mission.status === 'planned' && (
                       <button onClick={() => onValidate(mission)} className="text-green-400 hover:bg-green-500/20 p-1.5 rounded-lg transition-colors" title="Valider">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button onClick={() => onEdit(mission)} className="text-primary-400 hover:bg-primary-500/20 p-1.5 rounded-lg transition-colors" title="Modifier">
                        <Edit size={14} />
                    </button>
                    <button onClick={() => onDelete(mission.id)} className="text-red-400 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors" title="Supprimer">
                        <Trash2 size={14} />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;