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
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mes Missions</h1>
          <p className="text-gray-500 mt-1">Gérez l'historique complet de vos interventions.</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all"
        >
          <Plus size={20} />
          <span>Nouvelle Mission</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par titre, client, lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'planned', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === s 
                  ? 'bg-gray-800 text-white shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Tout voir' : s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary for Selection */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <Filter size={14} />
        <span>Affichage de <b>{filteredMissions.length}</b> mission(s)</span>
        <span className="w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
        <span className="flex items-center gap-1">
          Total généré : <b className="text-gray-900">{totalFilteredEarnings.toFixed(2)} €</b>
        </span>
      </div>

      {/* List / Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredMissions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-800">Aucune mission trouvée</p>
            <p className="text-sm">Essayez de modifier vos filtres ou créez une nouvelle mission.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Heure</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mission / Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lieu</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMissions.map((mission) => (
                  <tr key={mission.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock size={12} />
                          {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{mission.title}</span>
                        <span className="text-xs text-primary-600 font-medium flex items-center gap-1 mt-0.5">
                          <Briefcase size={12} /> {mission.client}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                         <MapPin size={14} className="text-gray-400" />
                         <span className="truncate max-w-[150px]">{mission.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-lg w-fit shadow-sm">
                        {mission.totalEarnings?.toFixed(0)} <Euro size={12} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${mission.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                          mission.status === 'planned' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                          'bg-red-100 text-red-800 border-red-200'}`}>
                        {mission.status === 'completed' ? 'Terminé' : mission.status === 'planned' ? 'Planifié' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(mission)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(mission.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
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