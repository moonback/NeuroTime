import React, { useState, useMemo } from 'react';
import { Mission } from '../types';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { Search, Edit, Trash2, MapPin, Clock, Briefcase, Plus, Filter, Euro } from 'lucide-react';
import { formatTimeSlots } from '../utils/timeSlots';

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
    <div className="space-y-5 md:space-y-6 pb-24 md:pb-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight mb-2">Mes Missions</h1>
          <p className="text-gray-300 text-sm md:text-base font-medium">Historique complet de vos interventions</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 hover:from-primary-400 hover:via-primary-500 hover:to-primary-400 text-dark-300 font-bold py-3 px-5 md:py-3.5 md:px-6 rounded-xl flex items-center gap-2.5 glow-blue transition-all text-sm md:text-base shadow-lg shadow-primary-500/30"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="tracking-wide">Nouvelle Mission</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-5 items-center justify-between shadow-lg">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="Rechercher une mission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 glass-light border-primary-500/25 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500/60 outline-none transition-all text-sm text-gray-100 placeholder-gray-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'planned', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all tracking-wide ${
                statusFilter === s 
                  ? 'bg-primary-500 text-dark-300 shadow-lg glow-blue' 
                  : 'glass-button text-gray-400 hover:text-primary-200 hover:shadow-md'
              }`}
            >
              {s === 'all' ? 'Tout' : s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary for Selection */}
      <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300 glass-light p-3 md:p-4 rounded-xl border border-primary-500/15">
        <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30">
          <Filter size={14} className="text-primary-300" strokeWidth={2.5} />
        </div>
        <span className="font-semibold"><b className="text-gray-100 font-black">{filteredMissions.length}</b> mission{filteredMissions.length > 1 ? 's' : ''}</span>
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
        <span className="flex items-center gap-1.5 font-semibold">
          Total : <b className="text-primary-300 font-black">{totalFilteredEarnings.toFixed(0)} €</b>
        </span>
      </div>

      {/* List / Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-lg">
        {filteredMissions.length === 0 ? (
          <div className="p-10 md:p-14 text-center text-gray-300">
            <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-dark-100/80 rounded-2xl flex items-center justify-center mb-4 md:mb-5 border border-primary-500/20 shadow-lg">
              <Search size={28} className="text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-lg md:text-xl font-bold text-gray-200 mb-2">Aucune mission trouvée</p>
            <p className="text-xs md:text-sm text-gray-400 font-medium">Modifiez vos filtres ou créez une nouvelle mission</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px] md:min-w-[800px]">
              <thead className="bg-dark-100/60 border-b border-primary-500/20 backdrop-blur-sm">
                <tr>
                  <th className="px-5 md:px-6 py-4 md:py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Date & Heure</th>
                  <th className="px-5 md:px-6 py-4 md:py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Mission / Client</th>
                  <th className="px-5 md:px-6 py-4 md:py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Lieu</th>
                  <th className="px-5 md:px-6 py-4 md:py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Montant</th>
                  <th className="px-5 md:px-6 py-4 md:py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Statut</th>
                  <th className="px-5 md:px-6 py-4 md:py-5 text-right text-xs font-bold text-gray-300 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-500/10">
                {filteredMissions.map((mission) => (
                  <tr key={mission.id} className="group hover:bg-dark-100/40 transition-all duration-300">
                    <td className="px-5 md:px-6 py-4 md:py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-100 text-sm md:text-base tracking-tight">{format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                          <Clock size={12} className="text-gray-500" strokeWidth={2} />
                          {formatTimeSlots(mission)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 md:px-6 py-4 md:py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-100 text-sm md:text-base tracking-tight">{mission.title}</span>
                        <span className="text-xs text-primary-300 font-semibold flex items-center gap-1.5 mt-1">
                          <Briefcase size={12} className="text-primary-400" strokeWidth={2} /> {mission.client}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 md:px-6 py-4 md:py-5 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                         <MapPin size={14} className="text-gray-400" strokeWidth={2} />
                         <span className="truncate max-w-[120px] md:max-w-[150px] font-medium">{mission.location}</span>
                      </div>
                    </td>
                    <td className="px-5 md:px-6 py-4 md:py-5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-black text-gray-100 bg-primary-500/20 border border-primary-500/40 px-3 py-1.5 rounded-lg w-fit shadow-md text-sm">
                        {mission.totalEarnings?.toFixed(0)} <Euro size={12} strokeWidth={2.5} />
                      </div>
                    </td>
                    <td className="px-5 md:px-6 py-4 md:py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm
                        ${mission.status === 'completed' ? 'bg-green-500/25 text-green-200 border-green-500/40' : 
                          mission.status === 'planned' ? 'bg-primary-500/25 text-primary-200 border-primary-500/40' : 
                          'bg-red-500/25 text-red-200 border-red-500/40'}`}>
                        {mission.status === 'completed' ? 'Terminé' : mission.status === 'planned' ? 'Planifié' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-5 md:px-6 py-4 md:py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => onEdit(mission)}
                          className="text-primary-300 hover:text-primary-200 bg-primary-500/25 hover:bg-primary-500/35 border border-primary-500/30 hover:border-primary-500/50 p-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Modifier"
                        >
                          <Edit size={16} strokeWidth={2} />
                        </button>
                        <button 
                          onClick={() => onDelete(mission.id)}
                          className="text-red-300 hover:text-red-200 bg-red-500/25 hover:bg-red-500/35 border border-red-500/30 hover:border-red-500/50 p-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Supprimer"
                        >
                          <Trash2 size={16} strokeWidth={2} />
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