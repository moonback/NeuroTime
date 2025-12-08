import React, { useState, useMemo, useEffect } from 'react';
import { Mission } from '../types';
import { 
  format, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  addWeeks,
  subWeeks,
  endOfWeek, 
  isSameMonth, 
  isToday,
  isSameWeek
} from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import fr from 'date-fns/locale/fr';
import { ChevronLeft, ChevronRight, MapPin, Trash2, Edit, Calendar, CheckCircle, Plus, Briefcase, Clock, Euro, Search, X, Grid3x3, CalendarDays, List, DollarSign } from 'lucide-react';
import { formatTimeSlots, getMissionTimeSlots } from '../utils/timeSlots';

interface CalendarViewProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
  onValidate: (mission: Mission) => void;
  onNewMission: (date: string) => void;
}

type ViewMode = 'month' | 'week' | 'list';

const CalendarView: React.FC<CalendarViewProps> = ({ missions, onEdit, onDelete, onValidate, onNewMission }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // If on mobile and view is week, switch to month view
      if (mobile && viewMode === 'week') {
        setViewMode('month');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode]);

  // Get unique clients for filter
  const uniqueClients = useMemo(() => {
    const clients = new Set(missions.map(m => m.client).filter(Boolean));
    return Array.from(clients).sort();
  }, [missions]);

  // Filter missions based on search, status, client, and payment
  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      // Status filter
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      
      // Client filter
      if (filterClient !== 'all' && m.client !== filterClient) return false;
      
      // Payment filter
      if (filterPaid === 'paid' && !m.isPaid) return false;
      if (filterPaid === 'unpaid' && m.isPaid) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(query);
        const matchesClient = m.client.toLowerCase().includes(query);
        const matchesLocation = m.location?.toLowerCase().includes(query) || false;
        const matchesDescription = m.description?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesClient && !matchesLocation && !matchesDescription) return false;
      }
      
      return true;
    });
  }, [missions, filterStatus, filterClient, filterPaid, searchQuery]);

  // Optimize mission lookup by date (O(1) access) with correct Local Time parsing
  const missionsByDate = useMemo(() => {
    const map = new Map<string, Mission[]>();
    filteredMissions.forEach(m => {
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
  }, [filteredMissions]);

  // Generate calendar grid for month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const monthStartDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthEndDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => eachDayOfInterval({
    start: monthStartDate,
    end: monthEndDate,
  }), [monthStartDate, monthEndDate]);

  // Generate week days for week view
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = useMemo(() => eachDayOfInterval({
    start: weekStart,
    end: weekEnd,
  }), [weekStart, weekEnd]);

  // Generate list view missions (sorted chronologically)
  const listViewMissions = useMemo(() => {
    return filteredMissions
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 50); // Limit to 50 for performance
  }, [filteredMissions]);

  // Calculate Stats based on current view
  const currentPeriodMissions = useMemo(() => {
    if (viewMode === 'month') {
      return filteredMissions.filter(m => isSameMonth(new Date(m.startTime), currentMonth));
    } else if (viewMode === 'week') {
      return filteredMissions.filter(m => {
        const missionDate = new Date(m.startTime);
        return isSameWeek(missionDate, currentWeek, { weekStartsOn: 1 });
      });
    }
    return filteredMissions;
  }, [filteredMissions, viewMode, currentMonth, currentWeek]);

  const periodRevenue = useMemo(() => 
    currentPeriodMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [currentPeriodMissions]
  );
  
  const periodHours = useMemo(() => 
    currentPeriodMissions.reduce((acc, m) => {
    const d = (m.details?.dayHours || 0) + (m.details?.nightHours || 0);
    return acc + d;
    }, 0),
    [currentPeriodMissions]
  );

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setCurrentWeek(now);
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
    <div className="flex flex-col gap-4 md:gap-6 h-full pb-24 md:pb-0 animate-fade-in">
      {/* Header with View Mode Toggle, Navigation & Stats */}
      <div className="glass-card rounded-2xl p-4 md:p-5 flex flex-col gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 glass-light p-0.5 rounded-lg border-primary-500/20">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'month' 
                  ? 'bg-primary-500 text-dark-300 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Grid3x3 size={14} />
              <span className="hidden sm:inline">Mois</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`hidden lg:flex px-3 py-1.5 rounded-md text-xs font-bold transition-all items-center gap-1.5 ${
                viewMode === 'week' 
                  ? 'bg-primary-500 text-dark-300 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <CalendarDays size={14} />
              <span className="hidden sm:inline">Semaine</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list' 
                  ? 'bg-primary-500 text-dark-300 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <List size={14} />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
             <div className="flex gap-0.5 glass-light p-0.5 rounded-lg border-primary-500/20">
              <button 
                onClick={viewMode === 'month' ? prevMonth : prevWeek} 
                className="p-1.5 hover:bg-dark-200 hover:shadow-sm rounded-md transition-all text-gray-300"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={goToToday} 
                className="px-2.5 py-1.5 text-[10px] md:text-xs font-bold text-gray-300 hover:bg-dark-200 hover:shadow-sm rounded-md transition-all"
              >
                Aujourd'hui
              </button>
              <button 
                onClick={viewMode === 'month' ? nextMonth : nextWeek} 
                className="p-1.5 hover:bg-dark-200 hover:shadow-sm rounded-md transition-all text-gray-300"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-100 capitalize">
              {viewMode === 'month' 
                ? format(currentMonth, 'MMMM yyyy', { locale: fr })
                : viewMode === 'week'
                ? `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
                : 'Toutes les missions'}
            </h2>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-dark-200/50 border border-primary-500/20 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 glass-light p-0.5 rounded-lg border-primary-500/20">
            {(['all', 'planned', 'completed', 'cancelled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  filterStatus === status
                    ? 'bg-primary-500/30 text-primary-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {status === 'all' ? 'Tous' : status === 'planned' ? 'Planifiées' : status === 'completed' ? 'Terminées' : 'Annulées'}
              </button>
            ))}
          </div>

          {/* Client Filter */}
          {uniqueClients.length > 0 && (
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-3 py-2 bg-dark-200/50 border border-primary-500/20 rounded-lg text-xs text-gray-100 focus:outline-none focus:border-primary-500/50"
            >
              <option value="all">Tous les clients</option>
              {uniqueClients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          )}

          {/* Payment Filter */}
          <div className="flex gap-1 glass-light p-0.5 rounded-lg border-primary-500/20">
            {(['all', 'paid', 'unpaid'] as const).map(paid => (
              <button
                key={paid}
                onClick={() => setFilterPaid(paid)}
                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                  filterPaid === paid
                    ? 'bg-emerald-500/30 text-emerald-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {paid === 'all' ? 'Tous' : paid === 'paid' ? <DollarSign size={12} /> : 'Non payé'}
              </button>
            ))}
          </div>
          </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
             <div className="flex-1 md:flex-none px-2.5 py-1.5 bg-primary-500/20 text-primary-300 rounded-lg font-medium border border-primary-500/30 flex items-center justify-center gap-1.5">
                <Clock size={14} />
            <span>{periodHours.toFixed(0)}h</span>
             </div>
             <div className="flex-1 md:flex-none px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5">
                <Euro size={14} />
            <span>{periodRevenue.toFixed(0)}€</span>
             </div>
          <div className="flex-1 md:flex-none px-2.5 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg font-medium border border-blue-500/30 flex items-center justify-center gap-1.5">
            <Briefcase size={14} />
            <span>{currentPeriodMissions.length}</span>
             </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1">
        {/* Calendar/Week/List View Panel */}
        <div className="flex-1 glass-card rounded-2xl p-4 md:p-5 lg:p-6 flex flex-col">

          {/* Month View */}
          {viewMode === 'month' && (
            <>
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-1.5 border-b border-primary-500/20 pb-1.5">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-[9px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 grid-rows-6 gap-px glass-light border-primary-500/20 rounded-lg overflow-hidden flex-1 min-h-[400px] md:min-h-[450px]">
          {calendarDays.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayMissions = missionsByDate.get(dateKey) || [];
            
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isTodayDate = isToday(date);
            const hasMissions = dayMissions.length > 0;
            
            // Calculate day total for heatmap badge
            const dayRevenue = dayMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
                  const dayHours = dayMissions.reduce((acc, m) => {
                    const d = (m.details?.dayHours || 0) + (m.details?.nightHours || 0);
                    return acc + d;
                  }, 0);

                  const handleDayClick = () => {
                    setSelectedDate(date);
                    if (isMobile) {
                      setIsMobileModalOpen(true);
                    }
                  };

            return (
              <div
                key={dateKey}
                      onClick={handleDayClick}
                onDoubleClick={() => onNewMission(dateKey)}
                className={`
                  relative p-1 md:p-1.5 flex flex-col transition-all duration-200 cursor-pointer select-none glass-light hover:glass-button
                  ${!isCurrentMonth ? 'opacity-50 text-gray-500' : ''}
                  ${isSelected ? 'bg-primary-500/20 inset-0' : ''}
                        ${hasMissions && isCurrentMonth ? 'bg-gradient-to-br from-primary-500/5 to-emerald-500/5' : ''}
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
                   
                         {/* Mini stats badge on desktop */}
                         {hasMissions && isCurrentMonth && (
                           <div className="hidden lg:flex flex-col items-end gap-0.5">
                             {dayRevenue > 0 && (
                               <span className="text-[8px] font-semibold text-emerald-300 bg-emerald-500/20 px-1 rounded border border-emerald-500/30">
                       {Math.round(dayRevenue)}€
                     </span>
                             )}
                             {dayHours > 0 && (
                               <span className="text-[8px] font-semibold text-primary-300 bg-primary-500/20 px-1 rounded border border-primary-500/30">
                                 {dayHours.toFixed(1)}h
                               </span>
                             )}
                           </div>
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
                          {dayMissions.slice(0, 3).map((m) => {
                            const timeSlots = getMissionTimeSlots(m);
                            const firstSlot = timeSlots[0];
                            return (
                      <div 
                        key={m.id} 
                        onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                        className={`
                          group flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border truncate cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm
                          ${m.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30 hover:border-green-500/50' : 
                            m.status === 'planned' ? 'bg-primary-500/20 text-primary-300 border-primary-500/30 hover:border-primary-500/50' : 
                            'bg-red-500/20 text-red-300 border-red-500/30 hover:border-red-500/50'}
                                  ${m.isPaid ? 'ring-1 ring-emerald-500/30' : ''}
                        `}
                                title={`${m.title} (${firstSlot.startTime}-${firstSlot.endTime}${timeSlots.length > 1 ? `, +${timeSlots.length - 1} créneau${timeSlots.length > 2 ? 'x' : ''}` : ''})`}
                      >
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${
                          m.status === 'completed' ? 'bg-green-400' : m.status === 'planned' ? 'bg-primary-400' : 'bg-red-400'
                        }`} />
                                <span className="font-bold opacity-75">{firstSlot.startTime}</span>
                        <span className="truncate font-medium">{m.title}</span>
                                {m.isPaid && <DollarSign size={10} className="text-emerald-400 flex-shrink-0" />}
                      </div>
                            );
                          })}
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
            </>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="flex flex-col flex-1 min-h-[500px]">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((date) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const dayMissions = missionsByDate.get(dateKey) || [];
                  const isTodayDate = isToday(date);
                  const isSelected = isSameDay(date, selectedDate);
                  
                  const handleWeekDayClick = () => {
                    setSelectedDate(date);
                    if (isMobile) {
                      setIsMobileModalOpen(true);
                    }
                  };

                  return (
                    <div
                      key={dateKey}
                      onClick={handleWeekDayClick}
                      className={`flex flex-col border border-primary-500/20 rounded-lg p-2 glass-light ${
                        isSelected ? 'ring-2 ring-primary-500/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold ${isTodayDate ? 'text-primary-400' : 'text-gray-300'}`}>
                          {format(date, 'EEE', { locale: fr })}
                        </span>
                        <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isTodayDate 
                            ? 'bg-primary-500 text-dark-300' 
                            : isSelected 
                            ? 'bg-primary-500/30 text-primary-300' 
                            : 'text-gray-400'
                        }`}>
                          {format(date, 'd')}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar min-h-[100px]">
                        {dayMissions.length === 0 ? (
                          <div className="text-center text-[10px] text-gray-500 py-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); onNewMission(dateKey); }}
                              className="text-primary-400 hover:underline"
                            >
                              Ajouter
                            </button>
                          </div>
                        ) : (
                          dayMissions.map((m) => {
                            const timeSlots = getMissionTimeSlots(m);
                            const firstSlot = timeSlots[0];
                            return (
                              <div
                                key={m.id}
                                onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                                className={`p-1.5 rounded text-[10px] border cursor-pointer transition-all hover:shadow-md ${
                                  m.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                                  m.status === 'planned' ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 
                                  'bg-red-500/20 text-red-300 border-red-500/30'
                                } ${m.isPaid ? 'ring-1 ring-emerald-500/30' : ''}`}
                              >
                                <div className="font-bold truncate mb-0.5">{m.title}</div>
                                <div className="text-[9px] opacity-75">
                                  {firstSlot.startTime}-{firstSlot.endTime}
                                  {timeSlots.length > 1 && ` (+${timeSlots.length - 1})`}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[9px] font-bold">{m.totalEarnings?.toFixed(0)}€</span>
                                  {m.isPaid && <DollarSign size={10} className="text-emerald-400" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-[400px]">
              {listViewMissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 opacity-60 py-12">
                  <Calendar size={32} strokeWidth={1.5} />
                  <p className="font-medium text-sm">Aucune mission trouvée</p>
                </div>
              ) : (
                listViewMissions.map((mission) => {
                  const missionDate = new Date(mission.startTime);
                  const timeSlots = getMissionTimeSlots(mission);
                  const isTodayMission = isToday(missionDate);
                  
                  return (
                    <div
                      key={mission.id}
                      onClick={() => onEdit(mission)}
                      className="glass-light rounded-lg p-3 md:p-4 border-primary-500/20 hover:border-primary-500/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              mission.status === 'completed' ? 'bg-green-400' : 
                              mission.status === 'planned' ? 'bg-primary-400' : 'bg-red-400'
                            }`}></span>
                            <h4 className="font-bold text-gray-100 text-sm md:text-base truncate">{mission.title}</h4>
                            {mission.isPaid && <DollarSign size={14} className="text-emerald-400 flex-shrink-0" />}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              <span className={isTodayMission ? 'text-primary-400 font-bold' : ''}>
                                {format(missionDate, 'EEEE d MMMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              <span>{formatTimeSlots(mission)}</span>
                              {timeSlots.length > 1 && (
                                <span className="text-[10px] bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded border border-primary-500/30">
                                  {timeSlots.length} créneaux
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase size={12} />
                              <span>{mission.client}</span>
                            </div>
                            {mission.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin size={12} />
                                <span className="truncate max-w-[150px]">{mission.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {mission.details && (
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
                              {mission.details.dayHours > 0 && (
                                <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                                  Jour: {mission.details.dayHours.toFixed(1)}h
                                </span>
                              )}
                              {mission.details.nightHours > 0 && (
                                <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                  Nuit: {mission.details.nightHours.toFixed(1)}h
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-base md:text-lg text-gray-100">
                            {mission.totalEarnings?.toFixed(0)}€
                          </span>
                          <div className="flex gap-1">
                            {mission.status === 'planned' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onValidate(mission); }} 
                                className="text-green-400 hover:bg-green-500/20 p-1.5 rounded-lg transition-colors" 
                                title="Valider"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEdit(mission); }} 
                              className="text-primary-400 hover:bg-primary-500/20 p-1.5 rounded-lg transition-colors" 
                              title="Modifier"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDelete(mission.id); }} 
                              className="text-red-400 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors" 
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
      </div>

        {/* Side Panel - Only show for month and week views on desktop */}
        {viewMode !== 'list' && !isMobile && (
      <div className="w-full lg:w-80 xl:w-96 glass-card rounded-2xl p-4 md:p-5 flex flex-col h-auto">
        <div className="mb-4 md:mb-6 border-b border-primary-500/20 pb-3 md:pb-4">
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
               <div className="flex-1 glass-light p-2 md:p-2.5 rounded-lg border-primary-500/20 flex flex-col items-center">
                 <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">Revenu</span>
                 <p className="text-base md:text-lg font-bold text-gray-100">{dailyTotal.toFixed(0)}€</p>
               </div>
               <div className="flex-1 glass-light p-2 md:p-2.5 rounded-lg border-primary-500/20 flex flex-col items-center">
                 <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">Missions</span>
                 <p className="text-base md:text-lg font-bold text-gray-100">{selectedMissions.length}</p>
               </div>
                   <div className="flex-1 glass-light p-2 md:p-2.5 rounded-lg border-primary-500/20 flex flex-col items-center">
                     <span className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">Heures</span>
                     <p className="text-base md:text-lg font-bold text-gray-100">
                       {selectedMissions.reduce((acc, m) => {
                         const d = (m.details?.dayHours || 0) + (m.details?.nightHours || 0);
                         return acc + d;
                       }, 0).toFixed(1)}h
                     </p>
                   </div>
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 md:space-y-3 pr-1 custom-scrollbar min-h-[250px] md:min-h-[300px]">
          {selectedMissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 opacity-60 py-8 md:py-10">
              <div className="glass-light p-3 md:p-4 rounded-full border-primary-500/20">
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
                selectedMissions.map(mission => {
                  const timeSlots = getMissionTimeSlots(mission);
                  return (
              <div 
                key={mission.id} 
                className="group relative glass-light rounded-lg p-2.5 md:p-3 border-primary-500/20 hover:border-primary-500/30 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                         <div className="flex items-start gap-2 overflow-hidden flex-1">
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${mission.status === 'completed' ? 'bg-green-400' : mission.status === 'planned' ? 'bg-primary-400' : 'bg-red-400'}`}></span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="font-bold text-gray-100 text-sm truncate">{mission.title}</h4>
                                {mission.isPaid && <DollarSign size={12} className="text-emerald-400 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                          <Clock size={10} />
                                <span>{formatTimeSlots(mission)}</span>
                                {timeSlots.length > 1 && (
                                  <span className="text-[9px] bg-primary-500/20 text-primary-300 px-1 rounded border border-primary-500/30">
                                    {timeSlots.length} créneaux
                                  </span>
                                )}
                        </div>
                      </div>
                   </div>
                         <span className="font-bold text-xs text-gray-200 glass-light px-1.5 py-0.5 rounded border-primary-500/20 flex-shrink-0">
                    {mission.totalEarnings?.toFixed(0)}€
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 pl-4 mb-2">
                   <Briefcase size={12} className="text-gray-500" />
                   <span className="truncate">{mission.client}</span>
                </div>

                      {mission.details && (mission.details.dayHours > 0 || mission.details.nightHours > 0) && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pl-4 mb-2">
                          {mission.details.dayHours > 0 && (
                            <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                              Jour: {mission.details.dayHours.toFixed(1)}h
                            </span>
                          )}
                          {mission.details.nightHours > 0 && (
                            <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                              Nuit: {mission.details.nightHours.toFixed(1)}h
                            </span>
                          )}
                        </div>
                      )}
                
                <div className="flex justify-end gap-1 pt-2 border-t border-primary-500/20">
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
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Modal for Day Details */}
      {isMobileModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/85 backdrop-blur-md transition-all animate-fade-in"
          onClick={() => setIsMobileModalOpen(false)}
        >
          <div 
            className="glass-strong rounded-t-3xl lg:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up-from-bottom lg:animate-scale-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-primary-500/25 glass-light relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex-1">
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-100 capitalize">
                  {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                </h2>
                <p className="text-xs md:text-sm mt-1.5 font-medium text-gray-300 capitalize">
                  {format(selectedDate, 'yyyy')}
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2">
                <button 
                  onClick={() => onNewMission(selectedDateKey)}
                  className="p-2 bg-primary-500 text-dark-300 rounded-lg hover:bg-primary-400 shadow-md shadow-primary-500/30 transition-all"
                  title="Ajouter une mission"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={() => setIsMobileModalOpen(false)}
                  className="p-2 hover:bg-dark-200/50 rounded-lg transition-all text-gray-400 hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Stats */}
            {selectedMissions.length > 0 && (
              <div className="flex gap-2 md:gap-3 p-4 md:p-5 border-b border-primary-500/20">
                <div className="flex-1 glass-light p-3 rounded-lg border-primary-500/20 flex flex-col items-center">
                  <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Revenu</span>
                  <p className="text-lg md:text-xl font-bold text-gray-100">{dailyTotal.toFixed(0)}€</p>
                </div>
                <div className="flex-1 glass-light p-3 rounded-lg border-primary-500/20 flex flex-col items-center">
                  <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Missions</span>
                  <p className="text-lg md:text-xl font-bold text-gray-100">{selectedMissions.length}</p>
                </div>
                <div className="flex-1 glass-light p-3 rounded-lg border-primary-500/20 flex flex-col items-center">
                  <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Heures</span>
                  <p className="text-lg md:text-xl font-bold text-gray-100">
                    {selectedMissions.reduce((acc, m) => {
                      const d = (m.details?.dayHours || 0) + (m.details?.nightHours || 0);
                      return acc + d;
                    }, 0).toFixed(1)}h
                  </p>
                </div>
              </div>
            )}

            {/* Missions List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3 custom-scrollbar">
              {selectedMissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-60 py-12">
                  <div className="glass-light p-4 rounded-full border-primary-500/20">
                    <Calendar size={32} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm md:text-base text-gray-400">Aucune activité</p>
                    <button 
                      onClick={() => {
                        setIsMobileModalOpen(false);
                        onNewMission(selectedDateKey);
                      }} 
                      className="text-primary-400 font-bold text-xs md:text-sm mt-3 hover:underline uppercase tracking-wide"
                    >
                      Créer une mission
                    </button>
                  </div>
                </div>
              ) : (
                selectedMissions.map(mission => {
                  const timeSlots = getMissionTimeSlots(mission);
                  return (
                    <div 
                      key={mission.id} 
                      className="group relative glass-light rounded-lg p-3 md:p-4 border-primary-500/20 hover:border-primary-500/30 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-2 overflow-hidden flex-1">
                          <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${mission.status === 'completed' ? 'bg-green-400' : mission.status === 'planned' ? 'bg-primary-400' : 'bg-red-400'}`}></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h4 className="font-bold text-gray-100 text-base md:text-lg truncate">{mission.title}</h4>
                              {mission.isPaid && <DollarSign size={14} className="text-emerald-400 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400 font-medium">
                              <Clock size={12} />
                              <span>{formatTimeSlots(mission)}</span>
                              {timeSlots.length > 1 && (
                                <span className="text-[10px] bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded border border-primary-500/30">
                                  {timeSlots.length} créneaux
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-sm md:text-base text-gray-200 glass-light px-2 py-1 rounded border-primary-500/20 flex-shrink-0">
                          {mission.totalEarnings?.toFixed(0)}€
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400 pl-5 mb-2">
                        <Briefcase size={12} className="text-gray-500" />
                        <span className="truncate">{mission.client}</span>
                      </div>

                      {mission.location && (
                        <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400 pl-5 mb-2">
                          <MapPin size={12} className="text-gray-500" />
                          <span className="truncate">{mission.location}</span>
                        </div>
                      )}

                      {mission.details && (mission.details.dayHours > 0 || mission.details.nightHours > 0) && (
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 pl-5 mb-2">
                          {mission.details.dayHours > 0 && (
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                              Jour: {mission.details.dayHours.toFixed(1)}h
                            </span>
                          )}
                          {mission.details.nightHours > 0 && (
                            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                              Nuit: {mission.details.nightHours.toFixed(1)}h
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 pt-3 border-t border-primary-500/20 mt-3">
                        {mission.status === 'planned' && (
                          <button 
                            onClick={() => {
                              onValidate(mission);
                              setIsMobileModalOpen(false);
                            }} 
                            className="text-green-400 hover:bg-green-500/20 p-2 rounded-lg transition-colors" 
                            title="Valider"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            onEdit(mission);
                            setIsMobileModalOpen(false);
                          }} 
                          className="text-primary-400 hover:bg-primary-500/20 p-2 rounded-lg transition-colors" 
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            onDelete(mission.id);
                            setIsMobileModalOpen(false);
                          }} 
                          className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors" 
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;