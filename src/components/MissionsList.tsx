import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Mission } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Search, Edit, Trash2, MapPin, Clock, Briefcase, Plus, Filter, Euro, CheckCircle2, Circle, CheckCircle, CalendarDays, Download, FileText, X } from 'lucide-react';
import { formatTimeSlots } from '../utils/timeSlots';
import { exportMissionsToCSV } from '../utils/export';
import { exportMissionsToPdf } from '../utils/exportPdf';
interface MissionsListProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onTogglePaid: (mission: Mission) => void;
  onComplete: (mission: Mission) => void;
  hidePrices?: boolean;
}

interface SwipeableCardProps {
  mission: Mission;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePaid: () => void;
  onComplete: () => void;
  hidePrices: boolean;
  formatPrice: (value: number | null | undefined) => string;
  swipedMissionId: string | null;
  onSwipeChange: (missionId: string | null) => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  mission,
  onEdit,
  onDelete,
  onTogglePaid,
  onComplete,
  hidePrices,
  formatPrice,
  swipedMissionId,
  onSwipeChange,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const isSwiped = swipedMissionId === mission.id;
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80; // Distance minimale pour déclencher le swipe
  const MAX_SWIPE = 200; // Distance maximale de swipe
  const SWIPE_ANGLE_THRESHOLD = 0.5; // Ratio pour déterminer si c'est un swipe horizontal

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Ne pas permettre le swipe si la mission est payée
    if (mission.isPaid) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  }, [mission.isPaid]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Détecter si c'est un mouvement horizontal ou vertical
    const isHorizontalSwipe = absDeltaX > absDeltaY * SWIPE_ANGLE_THRESHOLD;

    // Si le mouvement est principalement horizontal, activer le swipe
    if (isHorizontalSwipe && absDeltaX > 10) {
      if (!isSwiping.current) {
        isSwiping.current = true;
      }
      // Empêcher le scroll seulement si on swipe horizontalement
      e.preventDefault();

      // Swipe uniquement vers la gauche (deltaX négatif)
      if (deltaX < 0) {
        const offset = Math.max(-MAX_SWIPE, deltaX);
        setSwipeOffset(offset);
      } else if (deltaX > 0 && isSwiped) {
        // Permettre de revenir en arrière si déjà swipé
        const offset = Math.min(0, deltaX);
        setSwipeOffset(offset);
      }
    }
  }, [isSwiped]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;

    // Si le swipe dépasse le seuil, maintenir l'état swipé
    if (swipeOffset < -SWIPE_THRESHOLD) {
      setSwipeOffset(-MAX_SWIPE);
      onSwipeChange(mission.id);
    } else {
      // Sinon, revenir à la position initiale
      setSwipeOffset(0);
      onSwipeChange(null);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [swipeOffset, mission.id, onSwipeChange]);

  // Ajouter les écouteurs avec passive: false pour permettre preventDefault
  React.useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const handleActionClick = useCallback((action: () => void) => {
    action();
    // Réinitialiser le swipe après l'action
    setSwipeOffset(0);
    onSwipeChange(null);
  }, [onSwipeChange]);

  // Réinitialiser le swipe si une autre carte est swipée ou si la mission change
  React.useEffect(() => {
    const MAX_SWIPE_VALUE = 200;
    if (swipedMissionId !== mission.id) {
      setSwipeOffset(0);
    } else if (swipedMissionId === mission.id) {
      setSwipeOffset(-MAX_SWIPE_VALUE);
    }
  }, [swipedMissionId, mission.id]);

  // Fermer le swipe si l'utilisateur clique ailleurs ou fait défiler
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isSwiped && cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSwipeOffset(0);
        onSwipeChange(null);
      }
    };

    const handleScroll = () => {
      if (isSwiped) {
        setSwipeOffset(0);
        onSwipeChange(null);
      }
    };

    if (isSwiped) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isSwiped, onSwipeChange]);

  const hasSwipeActions = !mission.isPaid || (mission.status === 'planned' && !mission.isPaid);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Actions rapides révélées par le swipe */}
      {hasSwipeActions && (
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 bg-gradient-to-l from-primary-500/40 via-primary-500/30 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {mission.status === 'planned' && !mission.isPaid && (
              <button
                onClick={() => handleActionClick(onComplete)}
                className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg active:scale-95 transition-transform hover:bg-emerald-600"
                aria-label="Terminer"
              >
                <CheckCircle size={18} strokeWidth={2.5} />
              </button>
            )}
            {!mission.isPaid && (
              <>
                <button
                  onClick={() => handleActionClick(onEdit)}
                  className="p-3 rounded-xl bg-primary-500 text-white shadow-lg active:scale-95 transition-transform hover:bg-primary-600"
                  aria-label="Modifier"
                >
                  <Edit size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => handleActionClick(onDelete)}
                  className="p-3 rounded-xl bg-red-500 text-white shadow-lg active:scale-95 transition-transform hover:bg-red-600"
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Carte principale */}
      <div
        ref={cardRef}
        className="glass-card rounded-2xl p-4 space-y-3 relative bg-dark-200/80 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {/* Indicateur de swipe (visible uniquement si pas swipé et si actions disponibles) */}
        {!isSwiped && hasSwipeActions && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none animate-pulse">
            <div className="flex items-center gap-1 text-primary-400">
              <div className="w-1 h-1 rounded-full bg-primary-400"></div>
              <div className="w-1 h-1 rounded-full bg-primary-400"></div>
              <div className="w-1 h-1 rounded-full bg-primary-400"></div>
            </div>
          </div>
        )}
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
              onClick={onTogglePaid}
              className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border shadow-sm transition-all ${mission.isPaid
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

        {/* Actions (masquées sur mobile car disponibles via swipe, affichées uniquement si mission payée) */}
        {mission.isPaid && (
          <div className="pt-2 border-t border-primary-500/10">
            <div className="w-full text-center text-xs text-gray-500 italic py-2.5">
              Mission verrouillée (payée)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MissionsList: React.FC<MissionsListProps> = ({ missions, onEdit, onDelete, onNew, onTogglePaid, onComplete, hidePrices = false }) => {
  // Fonction utilitaire pour formater les montants avec masquage optionnel
  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'completed' | 'cancelled'>('all');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [swipedMissionId, setSwipedMissionId] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  // Extraire les clients uniques
  const uniqueClients = useMemo(() => {
    const clients = new Set(missions.map(m => m.client).filter(Boolean));
    return Array.from(clients).sort();
  }, [missions]);

  // Extraire les mois uniques pour le filtre
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>(missions.map(m => format(new Date(m.startTime), 'yyyy-MM')));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [missions]);

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

        const matchesClient = clientFilter === 'all' || m.client === clientFilter;

        const missionMonth = format(new Date(m.startTime), 'yyyy-MM');
        const matchesMonth = monthFilter === 'all' || missionMonth === monthFilter;

        return matchesSearch && matchesStatus && matchesPaid && matchesClient && matchesMonth;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [missions, searchTerm, statusFilter, paidFilter, clientFilter, monthFilter]);

  // Group missions by month
  const groupedMissions = useMemo(() => {
    const groups: { [key: string]: Mission[] } = {};
    filteredMissions.forEach(mission => {
      // Use startTime to group
      const date = new Date(mission.startTime);
      const key = format(date, 'yyyy-MM');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(mission);
    });
    return groups;
  }, [filteredMissions]);

  const sortedGroupKeys = Object.keys(groupedMissions).sort((a, b) => b.localeCompare(a));

  const totalFilteredEarnings = filteredMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);

  const handleExportPdf = () => {
    if (!pdfStartDate || !pdfEndDate) {
      alert('Veuillez sélectionner une date de début et de fin.');
      return;
    }
    const start = new Date(pdfStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(pdfEndDate);
    end.setHours(23, 59, 59, 999);

    const missionsToExport = missions.filter(m => {
      if (m.status !== 'completed') return false;
      const mDate = new Date(m.startTime);
      return mDate >= start && mDate <= end;
    });

    exportMissionsToPdf(missionsToExport, start, end);
    setShowPdfModal(false);
  };

  return (
    <div className="space-y-3 md:space-y-4 pb-20 md:pb-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-3">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-gray-50 tracking-tight">Mes Missions</h1>
          <p className="text-gray-500 text-[10px] font-medium tracking-wide">
            {monthFilter === 'all'
              ? 'Historique complet'
              : `Missions de ${format(new Date(parseInt(monthFilter.split('-')[0]), parseInt(monthFilter.split('-')[1]) - 1), 'MMMM yyyy', { locale: fr })}`
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex-1 md:flex-none glass-button hover:bg-red-500/10 text-red-400 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] border border-red-500/15"
          >
            <FileText size={13} strokeWidth={2.5} />
            <span>PDF</span>
          </button>
          <button
            onClick={() => exportMissionsToCSV(filteredMissions)}
            className="flex-1 md:flex-none glass-button hover:bg-indigo-500/10 text-indigo-300 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] border border-indigo-500/15"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>CSV</span>
          </button>
          <button
            onClick={onNew}
            className="flex-1 md:flex-none bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[10px] shadow-[0_2px_10px_rgba(99,102,241,0.25)]"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Nouvelle</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} strokeWidth={2} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 outline-none transition-all text-[11px] text-gray-100 placeholder-gray-500 font-medium"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {uniqueMonths.length > 0 && (
              <div className="relative w-full md:w-auto">
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full md:w-auto appearance-none pl-3 pr-8 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[10px] font-medium text-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-dark-200 text-gray-200">Tous les mois</option>
                  {uniqueMonths.map(monthKey => {
                    const [year, month] = monthKey.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    return (
                      <option key={monthKey} value={monthKey} className="bg-dark-200 text-gray-200 capitalize">
                        {format(date, 'MMMM yyyy', { locale: fr })}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <CalendarDays size={10} />
                </div>
              </div>
            )}

            {uniqueClients.length > 0 && (
              <div className="relative w-full md:w-auto">
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full md:w-auto appearance-none pl-3 pr-8 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[10px] font-medium text-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-dark-200 text-gray-200">Tous clients</option>
                  {uniqueClients.map(client => (
                    <option key={client} value={client} className="bg-dark-200 text-gray-200">{client}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Briefcase size={10} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
          <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto custom-scrollbar">
            {(['all', 'planned', 'completed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${statusFilter === s
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/[0.04] text-gray-400 hover:text-indigo-300'
                  }`}
              >
                {s === 'all' ? 'Tout' : s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto custom-scrollbar">
            {(['all', 'paid', 'unpaid'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPaidFilter(p)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${paidFilter === p
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/[0.04] text-gray-400 hover:text-emerald-300'
                  }`}
              >
                {p === 'all' ? 'Tous' : p === 'paid' ? 'Payé' : 'Non payé'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-300 bg-white/[0.02] border border-white/[0.05] p-2 rounded-lg">
        <div className="flex items-center gap-1.5">
          <Filter size={11} className="text-indigo-400" strokeWidth={2.5} />
          <span className="font-medium"><b className="text-gray-100 font-bold">{filteredMissions.length}</b> mission{filteredMissions.length > 1 ? 's' : ''}</span>
          <span className="text-gray-600">·</span>
          <span className="font-medium">Total: <b className="text-indigo-300 font-bold">{formatPrice(totalFilteredEarnings)} €</b></span>
        </div>
        {statusFilter === 'completed' && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-400" strokeWidth={2.5} />
              <b className="text-emerald-300">{filteredMissions.filter(m => m.isPaid).length}</b> payées
            </span>
            <span className="flex items-center gap-1">
              <Circle size={10} className="text-gray-400" strokeWidth={2.5} />
              <b className="text-gray-300">{filteredMissions.filter(m => !m.isPaid).length}</b> en attente
            </span>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredMissions.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="mx-auto w-10 h-10 bg-white/[0.04] rounded-lg flex items-center justify-center mb-2.5 border border-white/[0.06]">
              <Search size={18} className="text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-sm font-bold text-gray-200 mb-1">Aucune mission</p>
            <p className="text-[10px] text-gray-500">Modifiez vos filtres ou créez une mission</p>
          </div>
        ) : (
          sortedGroupKeys.map(monthKey => {
            const missionsInMonth = groupedMissions[monthKey];
            const [year, month] = monthKey.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1);

            return (
              <div key={monthKey} className="space-y-2">
                <div className="sticky top-[52px] z-10 bg-[#080b14]/95 backdrop-blur-xl py-1.5 px-2 -mx-1 border-b border-indigo-500/15 flex items-center gap-1.5">
                  <CalendarDays size={12} className="text-indigo-400" />
                  <h3 className="text-[11px] font-bold text-gray-200 capitalize">
                    {format(monthDate, 'MMMM yyyy', { locale: fr })}
                  </h3>
                  <span className="text-[9px] text-gray-500 font-medium ml-auto">
                    {missionsInMonth.length}
                  </span>
                </div>

                {missionsInMonth.map((mission) => (
                  <SwipeableCard
                    key={mission.id}
                    mission={mission}
                    onEdit={() => onEdit(mission)}
                    onDelete={() => onDelete(mission.id)}
                    onTogglePaid={() => onTogglePaid(mission)}
                    onComplete={() => onComplete(mission)}
                    hidePrices={hidePrices}
                    formatPrice={formatPrice}
                    swipedMissionId={swipedMissionId}
                    onSwipeChange={setSwipedMissionId}
                  />
                ))}
              </div>
            );
          })
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
                {sortedGroupKeys.map(monthKey => {
                  const missionsInMonth = groupedMissions[monthKey];
                  const [year, month] = monthKey.split('-');
                  const monthDate = new Date(parseInt(year), parseInt(month) - 1);

                  return (
                    <React.Fragment key={monthKey}>
                      {/* Month Header Row */}
                      <tr className="bg-dark-200/50">
                        <td colSpan={7} className="px-6 py-3 text-sm font-bold text-primary-300 border-y border-primary-500/10 sticky top-0 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={16} />
                            <span className="capitalize">{format(monthDate, 'MMMM yyyy', { locale: fr })}</span>
                            <span className="text-xs font-medium text-gray-500 ml-2">({missionsInMonth.length})</span>
                          </div>
                        </td>
                      </tr>
                      {missionsInMonth.map((mission) => (
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all hover:scale-105 ${mission.isPaid
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
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-300/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in border border-primary-500/20">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                <FileText className="text-red-400" />
                Export PDF des missions terminées
              </h2>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-300">
                Sélectionnez une période pour exporter vos missions terminées.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Date de début</label>
                  <input
                    type="date"
                    value={pdfStartDate}
                    onChange={(e) => setPdfStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 glass-light border-primary-500/20 rounded-xl focus:ring-2 focus:ring-primary-500/30 outline-none text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Date de fin</label>
                  <input
                    type="date"
                    value={pdfEndDate}
                    onChange={(e) => setPdfEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 glass-light border-primary-500/20 rounded-xl focus:ring-2 focus:ring-primary-500/30 outline-none text-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-white/5 bg-white/[0.02]">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExportPdf}
                disabled={!pdfStartDate || !pdfEndDate}
                className="px-5 py-2.5 text-sm font-medium bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-xl transition-all shadow-lg hover:shadow-red-500/20"
              >
                Générer PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionsList;