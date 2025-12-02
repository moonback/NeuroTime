import React, { useState, useMemo } from 'react';
import { Mission } from '../types';
import { format, isPast, isToday, isFuture, differenceInDays } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { Edit, Trash2, MapPin, Clock, Euro, GripVertical, Calendar, Briefcase, Search, Filter, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { formatTimeSlots } from '../utils/timeSlots';

interface KanbanViewProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
  onStatusChange: (missionId: string, newStatus: 'planned' | 'completed' | 'cancelled') => void;
}

type ColumnStatus = 'planned' | 'completed' | 'cancelled';

interface Column {
  id: ColumnStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  gradient: string;
}

const columns: Column[] = [
  {
    id: 'planned',
    title: 'Planifié',
    color: 'text-primary-300',
    bgColor: 'bg-primary-500/10',
    borderColor: 'border-primary-500/30',
    icon: <Calendar size={18} />,
    gradient: 'from-primary-500/20 via-primary-500/10 to-transparent'
  },
  {
    id: 'completed',
    title: 'Terminé',
    color: 'text-green-300',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: <CheckCircle2 size={18} />,
    gradient: 'from-green-500/20 via-green-500/10 to-transparent'
  },
  {
    id: 'cancelled',
    title: 'Annulé',
    color: 'text-red-300',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: <XCircle size={18} />,
    gradient: 'from-red-500/20 via-red-500/10 to-transparent'
  }
];

const KanbanView: React.FC<KanbanViewProps> = ({ missions, onEdit, onDelete, onStatusChange }) => {
  const [draggedMission, setDraggedMission] = useState<Mission | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const missionsByStatus = useMemo(() => {
    const grouped: Record<ColumnStatus, Mission[]> = {
      planned: [],
      completed: [],
      cancelled: []
    };
    
    missions.forEach(mission => {
      if (mission.status in grouped) {
        grouped[mission.status].push(mission);
      }
    });

    // Trier chaque colonne par date (plus récent en premier pour completed/cancelled, plus proche pour planned)
    Object.keys(grouped).forEach(status => {
      grouped[status as ColumnStatus].sort((a, b) => {
        if (status === 'planned') {
          // Pour les planifiées : trier par date croissante (plus proche en premier)
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        } else {
          // Pour terminées/annulées : trier par date décroissante (plus récent en premier)
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        }
      });
    });

    return grouped;
  }, [missions]);

  // Filtrer les missions par terme de recherche
  const filteredMissionsByStatus = useMemo(() => {
    if (!searchTerm.trim()) {
      return missionsByStatus;
    }

    const filtered: Record<ColumnStatus, Mission[]> = {
      planned: [],
      completed: [],
      cancelled: []
    };

    const lowerSearch = searchTerm.toLowerCase();
    
    Object.keys(missionsByStatus).forEach(status => {
      filtered[status as ColumnStatus] = missionsByStatus[status as ColumnStatus].filter(mission =>
        mission.title.toLowerCase().includes(lowerSearch) ||
        mission.client.toLowerCase().includes(lowerSearch) ||
        mission.location.toLowerCase().includes(lowerSearch) ||
        mission.description?.toLowerCase().includes(lowerSearch)
      );
    });

    return filtered;
  }, [missionsByStatus, searchTerm]);

  const handleDragStart = (e: React.DragEvent, mission: Mission) => {
    setDraggedMission(mission);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', mission.id);
    // Améliorer l'apparence de l'élément pendant le drag
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, columnId: ColumnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Ne réinitialiser que si on quitte vraiment la colonne (pas un enfant)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: ColumnStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedMission && draggedMission.status !== columnId) {
      onStatusChange(draggedMission.id, columnId);
    }
    
    setDraggedMission(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedMission(null);
    setDragOverColumn(null);
    // Réinitialiser l'opacité
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const getStatusBadgeClass = (status: ColumnStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-primary-500/20 text-primary-300 border-primary-500/30';
    }
  };

  const getMissionUrgency = (mission: Mission): 'urgent' | 'soon' | 'normal' => {
    if (mission.status !== 'planned') return 'normal';
    
    const missionDate = new Date(mission.startTime);
    const daysUntil = differenceInDays(missionDate, new Date());
    
    if (isPast(missionDate) || daysUntil < 0) return 'urgent';
    if (isToday(missionDate) || daysUntil <= 2) return 'soon';
    return 'normal';
  };

  const getUrgencyBadge = (urgency: 'urgent' | 'soon' | 'normal') => {
    if (urgency === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
          <AlertCircle size={10} />
          Urgent
        </span>
      );
    }
    if (urgency === 'soon') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <Clock size={10} />
          Bientôt
        </span>
      );
    }
    return null;
  };

  // Calculer les statistiques globales
  const totalStats = useMemo(() => {
    const allMissions = Object.values(missionsByStatus).flat();
    const totalEarnings = allMissions.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);
    const completedEarnings = missionsByStatus.completed.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);
    const plannedEarnings = missionsByStatus.planned.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);
    
    return {
      total: allMissions.length,
      totalEarnings,
      completedEarnings,
      plannedEarnings,
      completedCount: missionsByStatus.completed.length,
      plannedCount: missionsByStatus.planned.length,
      cancelledCount: missionsByStatus.cancelled.length
    };
  }, [missionsByStatus]);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">
      {/* Header avec statistiques */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight flex items-center gap-3">
            <span>Tableau Kanban</span>
            <span className="text-sm font-normal text-gray-400">({totalStats.total} missions)</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Organisez vos missions par statut avec drag & drop</p>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="glass-card p-3 md:p-4 rounded-lg border border-primary-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary-400" />
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-primary-300">
              {totalStats.totalEarnings.toFixed(0)} <Euro size={14} className="inline" />
            </div>
          </div>
          <div className="glass-card p-3 md:p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-xs text-gray-400">Terminé</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-green-300">
              {totalStats.completedEarnings.toFixed(0)} <Euro size={14} className="inline" />
            </div>
          </div>
          <div className="glass-card p-3 md:p-4 rounded-lg border border-primary-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-primary-400" />
              <span className="text-xs text-gray-400">Planifié</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-primary-300">
              {totalStats.plannedEarnings.toFixed(0)} <Euro size={14} className="inline" />
            </div>
          </div>
          <div className="glass-card p-3 md:p-4 rounded-lg border border-dark-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">Missions</span>
            </div>
            <div className="text-lg md:text-xl font-bold text-gray-300">
              {totalStats.total}
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-button pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`glass-button px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-all ${
              showFilters ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : ''
            }`}
          >
            <Filter size={18} />
            <span className="hidden md:inline">Filtres</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {columns.map((column, index) => {
          const columnMissions = filteredMissionsByStatus[column.id];
          const isDragOver = dragOverColumn === column.id;
          const totalEarnings = columnMissions.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);
          const missionCount = columnMissions.length;

          return (
            <div
              key={column.id}
              className={`flex flex-col h-full min-h-[500px] rounded-xl border-2 transition-all duration-300 ${
                isDragOver
                  ? `${column.borderColor} ${column.bgColor} border-dashed scale-[1.02] shadow-2xl`
                  : 'border-dark-200/50 glass-strong hover:border-primary-500/20'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header avec gradient */}
              <div className={`p-4 border-b ${column.borderColor} rounded-t-xl relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${column.gradient} opacity-50`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className={`text-lg font-bold ${column.color} flex items-center gap-2`}>
                      {column.icon}
                      {column.title}
                    </h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClass(column.id)} border`}>
                      {missionCount}
                    </span>
                  </div>
                  {totalEarnings > 0 && (
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-300">
                      <Euro size={14} />
                      <span>{totalEarnings.toFixed(0)} €</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-400px)] custom-scrollbar">
                {missionCount === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm border-2 border-dashed border-dark-200/30 rounded-lg glass-light">
                    <div className="text-4xl mb-2 opacity-50">{column.id === 'planned' ? '📅' : column.id === 'completed' ? '✅' : '❌'}</div>
                    <span>Aucune mission</span>
                    {searchTerm && <span className="text-xs mt-1 text-gray-600">Essayez un autre terme</span>}
                  </div>
                ) : (
                  columnMissions.map((mission, missionIndex) => {
                    const isDragging = draggedMission?.id === mission.id;
                    const missionDate = new Date(mission.startTime);
                    const formattedDate = format(missionDate, 'dd MMM yyyy', { locale: fr });
                    const formattedTime = formatTimeSlots(mission);
                    const urgency = getMissionUrgency(mission);
                    const isOverdue = mission.status === 'planned' && isPast(missionDate) && !isToday(missionDate);

                    return (
                      <div
                        key={mission.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, mission)}
                        onDragEnd={handleDragEnd}
                        className={`glass-card p-4 rounded-lg border transition-all duration-200 cursor-move group relative overflow-hidden ${
                          isDragging 
                            ? 'opacity-30 scale-95 rotate-2' 
                            : 'hover:border-primary-500/50 hover:shadow-xl hover:scale-[1.02] border-dark-200/50'
                        } ${isOverdue ? 'border-red-500/50 bg-red-500/5' : ''}`}
                        style={{ 
                          animationDelay: `${missionIndex * 50}ms`,
                          animation: isDragging ? 'none' : 'fade-in 0.3s ease-out'
                        }}
                      >
                        {/* Effet de brillance au survol */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        
                        {/* Drag Handle */}
                        <div className="flex items-start gap-2 mb-3 relative z-10">
                          <GripVertical size={16} className="text-gray-500 mt-1 cursor-grab active:cursor-grabbing group-hover:text-primary-400 transition-colors" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-100 text-sm md:text-base truncate flex-1">
                                {mission.title}
                              </h3>
                              {urgency !== 'normal' && getUrgencyBadge(urgency)}
                            </div>
                            {mission.client && (
                              <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                <Briefcase size={12} />
                                {mission.client}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Mission Details */}
                        <div className="space-y-2 text-xs text-gray-400 relative z-10">
                          {mission.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="flex-shrink-0 text-primary-400" />
                              <span className="truncate">{mission.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="flex-shrink-0 text-primary-400" />
                            <span className={isOverdue ? 'text-red-300 font-semibold' : ''}>{formattedDate}</span>
                            {isOverdue && <span className="text-red-400 text-[10px]">(En retard)</span>}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="flex-shrink-0 text-primary-400" />
                            <span>{formattedTime}</span>
                          </div>

                          {mission.totalEarnings > 0 && (
                            <div className="flex items-center gap-1.5 font-semibold text-primary-300 pt-1 border-t border-dark-200/20">
                              <Euro size={12} />
                              <span>{mission.totalEarnings.toFixed(0)} €</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-200/30 relative z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(mission);
                            }}
                            className="flex-1 glass-button text-xs py-1.5 px-2 rounded-md hover:bg-primary-500/20 hover:text-primary-300 transition-all flex items-center justify-center gap-1 group/btn"
                          >
                            <Edit size={12} className="group-hover/btn:scale-110 transition-transform" />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Êtes-vous sûr de vouloir supprimer cette mission ?")) {
                                onDelete(mission.id);
                              }
                            }}
                            className="glass-button text-xs py-1.5 px-2 rounded-md hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center justify-center gap-1 group/btn"
                          >
                            <Trash2 size={12} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
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

      {/* Indication de drag & drop */}
      {draggedMission && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-lg border border-primary-500/30 animate-slide-in-up z-50">
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <GripVertical size={16} className="text-primary-400" />
            <span>Glissez la mission vers une autre colonne pour changer son statut</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default KanbanView;
