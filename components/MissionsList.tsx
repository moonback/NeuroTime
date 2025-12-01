import React, { useState, useMemo } from 'react';
import { Mission } from '../types';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { Search, Edit, Trash2, MapPin, Clock, Briefcase, Plus, Filter, Euro } from 'lucide-react';

interface MissionsListProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const MissionsList: React.FC<MissionsListProps> = ({ missions, onEdit, onDelete, onNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'completed' | 'cancelled'>('all');

  const filteredMissions = useMemo(() => {
    return missions
      .filter(m => {
        const matchesSearch = 
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.location.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [missions, searchTerm, statusFilter]);

  const totalFilteredEarnings = filteredMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100 tracking-tight">Mes Missions</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Historique complet de vos interventions</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-primary-500 hover:bg-primary-400 text-dark-300 font-medium py-2 px-4 md:py-2.5 md:px-5 rounded-lg md:rounded-xl flex items-center gap-2 shadow-md shadow-primary-500/30 transition-all text-sm md:text-base"
        >
          <Plus size={18} />
          <span>Nouvelle Mission</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-dark-50 rounded-xl md:rounded-2xl shadow-sm border border-dark-100 p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'planned', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === s 
                  ? 'bg-primary-500 text-dark-300 shadow-sm' 
                  : 'bg-dark-100 border border-dark-200 text-gray-400 hover:bg-dark-200 hover:text-gray-200'
              }`}
            >
              {s === 'all' ? 'Tout' : s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary for Selection */}
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 bg-dark-50 p-2.5 md:p-3 rounded-lg border border-dark-100">
        <Filter size={12} />
        <span><b className="text-gray-200">{filteredMissions.length}</b> mission{filteredMissions.length > 1 ? 's' : ''}</span>
        <span className="w-1 h-1 bg-gray-600 rounded-full mx-1"></span>
        <span className="flex items-center gap-1">
          Total : <b className="text-gray-100">{totalFilteredEarnings.toFixed(0)} €</b>
        </span>
      </div>

      {/* List / Table */}
      <div className="bg-dark-50 rounded-xl md:rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
        {filteredMissions.length === 0 ? (
          <div className="p-8 md:p-12 text-center text-gray-400">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-dark-100 rounded-full flex items-center justify-center mb-3 md:mb-4 border border-dark-200">
              <Search size={24} className="text-gray-500" />
            </div>
            <p className="text-base md:text-lg font-medium text-gray-200">Aucune mission trouvée</p>
            <p className="text-xs md:text-sm mt-1 text-gray-500">Modifiez vos filtres ou créez une nouvelle mission</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] md:min-w-[800px]">
              <thead className="bg-dark-100 border-b border-dark-200">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Heure</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Mission / Client</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Lieu</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Montant</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {filteredMissions.map((mission) => (
                  <tr key={mission.id} className="group hover:bg-dark-100/50 transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-100 text-sm md:text-base">{format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}</span>
                        <span className="text-[10px] md:text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-100 text-sm md:text-base">{mission.title}</span>
                        <span className="text-[10px] md:text-xs text-primary-400 font-medium flex items-center gap-1 mt-0.5">
                          <Briefcase size={10} /> {mission.client}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-300">
                      <div className="flex items-center gap-1.5">
                         <MapPin size={12} className="text-gray-500" />
                         <span className="truncate max-w-[120px] md:max-w-[150px]">{mission.location}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-bold text-gray-100 bg-dark-100 border border-dark-200 px-2 md:px-3 py-0.5 md:py-1 rounded-md w-fit shadow-sm text-xs md:text-sm">
                        {mission.totalEarnings?.toFixed(0)} <Euro size={10} />
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border
                        ${mission.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                          mission.status === 'planned' ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 
                          'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                        {mission.status === 'completed' ? 'Terminé' : mission.status === 'planned' ? 'Planifié' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                      <div className="flex items-center justify-end gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(mission)}
                          className="text-primary-400 hover:text-primary-300 bg-primary-500/20 hover:bg-primary-500/30 p-1.5 md:p-2 rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => onDelete(mission.id)}
                          className="text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30 p-1.5 md:p-2 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Card View (Visible only on small screens via CSS/Responsiveness if needed, but table with scroll is often OK) */}
      {/* For this implementation, the table is responsive with horizontal scroll, which is robust. */}
    </div>
  );
};

export default MissionsList;