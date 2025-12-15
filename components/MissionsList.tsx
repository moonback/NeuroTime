import React, { useState, useMemo } from 'react';
import { Mission } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Search, Edit, Trash2, MapPin, Clock, Briefcase, Plus, Filter, Euro, CheckCircle2, Circle, CheckCircle } from 'lucide-react';
import { formatTimeSlots } from '../utils/timeSlots';

interface MissionsListProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onTogglePaid: (mission: Mission) => void;
  onComplete: (mission: Mission) => void;
  hidePrices?: boolean;
}

const MissionsList: React.FC<MissionsListProps> = ({ missions, onEdit, onDelete, onNew, onTogglePaid, onComplete, hidePrices = false }) => {
  // Fonction utilitaire pour formater les montants avec masquage optionnel
  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'completed' | 'cancelled'>('planned');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const filteredMissions = useMemo(() => {
    return missions
      .filter(m => {
        const matchesSearch = 
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.location.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        
        const matchesPaid = paidFilter === 'all' || 
          (paidFilter === 'paid' && m.isPaid === true) ||
          (paidFilter === 'unpaid' && (m.isPaid === false || m.isPaid === undefined));
        
        return matchesSearch && matchesStatus && matchesPaid;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [missions, searchTerm, statusFilter, paidFilter]);

  const totalFilteredEarnings = filteredMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);

  return (
    <div className="space-y-5 md:space-y-6 pb-24 md:pb-8 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-50 tracking-tight mb-2">Mes Missions</h1>
          <p className="text-gray-300 text-sm md:text-base font-medium">Historique complet de vos interventions</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={onNew}
            className="w-full md:w-auto bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-5 md:py-3.5 md:px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all text-sm md:text-base shadow-md hover:shadow-lg"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="tracking-wide">Nouvelle Mission</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-5 items-center justify-between shadow-md">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="Rechercher une mission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 glass-light border-primary-500/15 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 outline-none transition-all text-sm text-gray-100 placeholder-gray-400 font-medium"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {(['all', 'planned', 'completed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all tracking-wide ${
                  statusFilter === s 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'glass-button text-gray-400 hover:text-primary-300 hover:shadow-sm'
                }`}
              >
                {s === 'all' ? 'Tout' : s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {(['all', 'paid', 'unpaid'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPaidFilter(p)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all tracking-wide ${
                  paidFilter === p 
                    ? 'bg-emerald-500 text-dark-300 shadow-md' 
                    : 'glass-button text-gray-400 hover:text-emerald-200 hover:shadow-sm'
                }`}
              >
                {p === 'all' ? 'Tous' : p === 'paid' ? 'Payé' : 'Non payé'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary for Selection */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 text-xs md:text-sm text-gray-300 glass-light p-3 md:p-4 rounded-xl border border-primary-500/12">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-1.5 rounded-lg bg-primary-500/15 border border-primary-500/25">
            <Filter size={14} className="text-primary-300" strokeWidth={2.5} />
          </div>
          <span className="font-medium"><b className="text-gray-50 font-bold">{filteredMissions.length}</b> mission{filteredMissions.length > 1 ? 's' : ''}</span>
          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
          <span className="flex items-center gap-1.5 font-medium">
            Total : <b className="text-primary-300 font-bold">{formatPrice(totalFilteredEarnings)} €</b>
          </span>
        </div>
        {statusFilter === 'completed' && (
          <>
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full hidden md:block"></span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-emerald-400" strokeWidth={2.5} />
                Payées : <b className="text-emerald-300 font-bold">
                  {filteredMissions.filter(m => m.isPaid).length}
                </b>
              </span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
              <span className="flex items-center gap-1.5 font-medium">
                <Circle size={14} className="text-gray-400" strokeWidth={2.5} />
                Non payées : <b className="text-gray-300 font-bold">
                  {filteredMissions.filter(m => !m.isPaid).length}
                </b>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredMissions.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-dark-100/80 rounded-2xl flex items-center justify-center mb-4 border border-primary-500/20 shadow-md">
              <Search size={24} className="text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-lg font-bold text-gray-200 mb-2">Aucune mission trouvée</p>
            <p className="text-xs text-gray-400 font-medium">Modifiez vos filtres ou créez une nouvelle mission</p>
          </div>
        ) : (
          filteredMissions.map((mission) => (
            <div key={mission.id} className="glass-card rounded-2xl p-4 space-y-3">
              {/* Header avec Date et Statut */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-gray-50 text-sm tracking-tight">
                      {format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border
                      ${mission.status === 'completed' ? 'bg-green-500/25 text-green-200 border-green-500/40' : 
                        mission.status === 'planned' ? 'bg-primary-500/25 text-primary-200 border-primary-500/40' : 
                        'bg-red-500/25 text-red-200 border-red-500/40'}`}>
                      {mission.status === 'completed' ? 'Terminé' : mission.status === 'planned' ? 'Planifié' : 'Annulé'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <Clock size={12} className="text-gray-500" strokeWidth={2} />
                    {formatTimeSlots(mission)}
                  </div>
                </div>
                <div className="flex items-center gap-1 font-black text-gray-50 bg-primary-500/20 border border-primary-500/30 px-2.5 py-1.5 rounded-lg shadow-sm text-sm">
                  {formatPrice(mission.totalEarnings)} {!hidePrices && <Euro size={12} strokeWidth={2.5} />}
                </div>
              </div>

              {/* Titre et Client */}
              <div>
                <h3 className="font-bold text-gray-50 text-base tracking-tight mb-1.5">{mission.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-primary-300 font-semibold">
                  <Briefcase size={12} className="text-primary-400" strokeWidth={2} />
                  {mission.client}
                </div>
              </div>

              {/* Lieu */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin size={14} className="text-gray-400" strokeWidth={2} />
                <span className="font-medium">{mission.location}</span>
              </div>

              {/* Paiement (si terminé) */}
              {mission.status === 'completed' && (
                <div className="pt-2 border-t border-primary-500/10">
                  <button
                    onClick={() => onTogglePaid(mission)}
                    className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border shadow-sm transition-all ${
                      mission.isPaid 
                        ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/35' 
                        : 'bg-gray-500/15 text-gray-400 border-gray-500/25 hover:bg-gray-500/25 hover:text-gray-300'
                    }`}
                  >
                    {mission.isPaid ? (
                      <>
                        <CheckCircle2 size={14} strokeWidth={2.5} />
                        Payé
                      </>
                    ) : (
                      <>
                        <Circle size={14} strokeWidth={2.5} />
                        Non payé
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-primary-500/10 flex items-center gap-2">
                {mission.status === 'planned' && !mission.isPaid && (
                  <button 
                    onClick={() => onComplete(mission)}
                    className="flex-1 text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-xs font-semibold"
                  >
                    <CheckCircle size={14} strokeWidth={2} />
                    Terminer
                  </button>
                )}
                {!mission.isPaid ? (
                  <>
                    <button 
                      onClick={() => onEdit(mission)}
                      className="flex-1 text-primary-300 hover:text-primary-200 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 hover:border-primary-500/50 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-xs font-semibold"
                    >
                      <Edit size={14} strokeWidth={2} />
                      Modifier
                    </button>
                    <button 
                      onClick={() => onDelete(mission.id)}
                      className="flex-1 text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-xs font-semibold"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                      Supprimer
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-xs text-gray-500 italic py-2.5">
                    Mission verrouillée (payée)
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden shadow-lg">
        {filteredMissions.length === 0 ? (
          <div className="p-14 text-center text-gray-300">
            <div className="mx-auto w-20 h-20 bg-dark-100/80 rounded-2xl flex items-center justify-center mb-5 border border-primary-500/20 shadow-lg">
              <Search size={28} className="text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-xl font-bold text-gray-200 mb-2">Aucune mission trouvée</p>
            <p className="text-sm text-gray-400 font-medium">Modifiez vos filtres ou créez une nouvelle mission</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-dark-100/60 border-b border-primary-500/20 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Date & Heure</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Mission / Client</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Lieu</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Montant</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-5 text-left text-xs font-bold text-gray-300 uppercase tracking-widest">Paiement</th>
                  <th className="px-6 py-5 text-right text-xs font-bold text-gray-300 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-500/10">
                {filteredMissions.map((mission) => (
                  <tr key={mission.id} className="group hover:bg-dark-100/40 transition-all duration-300">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-50 text-base tracking-tight">{format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                          <Clock size={12} className="text-gray-500" strokeWidth={2} />
                          {formatTimeSlots(mission)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-50 text-base tracking-tight">{mission.title}</span>
                        <span className="text-xs text-primary-300 font-semibold flex items-center gap-1.5 mt-1">
                          <Briefcase size={12} className="text-primary-400" strokeWidth={2} /> {mission.client}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                         <MapPin size={14} className="text-gray-400" strokeWidth={2} />
                         <span className="truncate max-w-[150px] font-medium">{mission.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-black text-gray-50 bg-primary-500/20 border border-primary-500/30 px-3 py-1.5 rounded-lg w-fit shadow-sm text-sm">
                        {formatPrice(mission.totalEarnings)} {!hidePrices && <Euro size={12} strokeWidth={2.5} />}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm
                        ${mission.status === 'completed' ? 'bg-green-500/25 text-green-200 border-green-500/40' : 
                          mission.status === 'planned' ? 'bg-primary-500/25 text-primary-200 border-primary-500/40' : 
                          'bg-red-500/25 text-red-200 border-red-500/40'}`}>
                        {mission.status === 'completed' ? 'Terminé' : mission.status === 'planned' ? 'Planifié' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {mission.status === 'completed' ? (
                        <button
                          onClick={() => onTogglePaid(mission)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all hover:scale-105 ${
                            mission.isPaid 
                              ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50 hover:bg-emerald-500/40' 
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30 hover:text-gray-300'
                          }`}
                          title={mission.isPaid ? 'Marquer comme non payé' : 'Marquer comme payé'}
                        >
                          {mission.isPaid ? (
                            <>
                              <CheckCircle2 size={14} strokeWidth={2.5} />
                              Payé
                            </>
                          ) : (
                            <>
                              <Circle size={14} strokeWidth={2.5} />
                              Non payé
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {mission.status === 'planned' && !mission.isPaid && (
                          <button 
                            onClick={() => onComplete(mission)}
                            className="text-emerald-300 hover:text-emerald-200 bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-500/30 hover:border-emerald-500/50 p-2 rounded-lg transition-all shadow-sm hover:shadow-md"
                            title="Marquer comme terminée"
                          >
                            <CheckCircle size={16} strokeWidth={2} />
                          </button>
                        )}
                        {!mission.isPaid ? (
                          <>
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
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 italic px-2" title="Mission payée - Modification et suppression désactivées">
                            Verrouillée
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionsList;