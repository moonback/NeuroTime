import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, CheckCircle, Clock, MapPin, Moon, Sun, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Mission } from '../../types';

interface SwipeableUpcomingMissionCardProps {
  mission: Mission;
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  hidePrices: boolean;
  formatPrice: (value: number | null | undefined) => string;
  swipedMissionId: string | null;
  onSwipeChange: (missionId: string | null) => void;
  index: number;
}

const SwipeableUpcomingMissionCard: React.FC<SwipeableUpcomingMissionCardProps> = ({
  mission, onEdit, onValidate, hidePrices, formatPrice, swipedMissionId, onSwipeChange, index,
}) => {
  const isSwiped = swipedMissionId === mission.id;
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 200;
  const SWIPE_ANGLE_THRESHOLD = 0.5;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const isHorizontalSwipe = absDeltaX > absDeltaY * SWIPE_ANGLE_THRESHOLD;

    if (isHorizontalSwipe && absDeltaX > 10) {
      if (!isSwiping.current) isSwiping.current = true;
      e.preventDefault();
      if (deltaX < 0) setSwipeOffset(Math.max(-MAX_SWIPE, deltaX));
      else if (deltaX > 0 && isSwiped) setSwipeOffset(Math.min(0, deltaX));
    }
  }, [isSwiped]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;
    if (swipeOffset < -SWIPE_THRESHOLD) {
      setSwipeOffset(-MAX_SWIPE);
      onSwipeChange(mission.id);
    } else {
      setSwipeOffset(0);
      onSwipeChange(null);
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [swipeOffset, mission.id, onSwipeChange]);

  useEffect(() => {
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
    setSwipeOffset(0);
    onSwipeChange(null);
  }, [onSwipeChange]);

  useEffect(() => {
    if (swipedMissionId !== mission.id) setSwipeOffset(0);
    else if (swipedMissionId === mission.id) setSwipeOffset(-MAX_SWIPE);
  }, [swipedMissionId, mission.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isSwiped && cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSwipeOffset(0);
        onSwipeChange(null);
      }
    };
    const handleScroll = () => { if (isSwiped) { setSwipeOffset(0); onSwipeChange(null); } };
    if (isSwiped) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => { document.removeEventListener('click', handleClickOutside); window.removeEventListener('scroll', handleScroll, true); };
    }
  }, [isSwiped, onSwipeChange]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe actions */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 bg-[var(--bg-elevated)] pointer-events-none md:hidden">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => handleActionClick(() => onValidate(mission))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)] text-white active:scale-95 transition-transform"
            aria-label="Valider"
          >
            <CheckCircle size={15} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleActionClick(() => onEdit(mission))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white active:scale-95 transition-transform"
            aria-label="Modifier"
          >
            <Edit size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="group relative flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3.5 transition-all duration-200 hover:border-[var(--border-default)] md:flex-row md:items-center md:gap-4 md:p-4"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
          animationDelay: `${index * 40}ms`,
        }}
      >
        {/* Swipe indicator */}
        {!isSwiped && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none md:hidden">
            <div className="flex items-center gap-0.5 text-[var(--accent)]">
              <div className="w-0.5 h-0.5 rounded-full bg-[var(--accent)]" />
              <div className="w-0.5 h-0.5 rounded-full bg-[var(--accent)]" />
              <div className="w-0.5 h-0.5 rounded-full bg-[var(--accent)]" />
            </div>
          </div>
        )}

        {/* Date Badge */}
        <div
          onClick={() => onEdit(mission)}
          className="relative z-10 flex min-w-[64px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/[0.035] p-2.5 text-center transition-all group-hover:border-[var(--border-default)] md:flex-col md:gap-0"
        >
          <div className="text-[9px] text-[var(--text-muted)] uppercase font-semibold tracking-[0.14em]">
            {format(new Date(mission.startTime), 'MMM', { locale: fr })}
          </div>
          <div className="text-xl font-semibold text-[var(--text-primary)] leading-none md:mt-0.5">
            {format(new Date(mission.startTime), 'dd')}
          </div>
          <div className="md:hidden h-4 w-px bg-white/[0.06] mx-1" />
          <div className="md:hidden text-xs font-bold text-gray-300">
            {format(new Date(mission.startTime), 'HH:mm')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(mission)}>
          <div className="flex justify-between items-start gap-1.5">
            <h4 className="truncate text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-hover)]">{mission.title}</h4>
            {!hidePrices && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                {formatPrice(mission.totalEarnings)}€
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-medium text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-2 py-1">
              <Clock size={10} className="text-[var(--text-muted)]" />
              {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={10} className="text-[var(--text-muted)]" />
              <span className="truncate max-w-[120px]">{mission.location}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              {mission.rateType === 'night' ? <Moon size={9} className="text-purple-400" /> : <Sun size={9} className="text-amber-400" />}
              {mission.rateType === 'night' ? 'Nuit' : 'Jour'}
            </span>
          </div>
        </div>

        {/* Validate (desktop) */}
        <div className="hidden md:flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onValidate(mission); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15"
            title="Valider les heures"
          >
            <CheckCircle size={13} />
            <span className="hidden lg:inline">Valider</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface UpcomingMissionsListProps {
  upcomingMissions: Mission[];
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  hidePrices?: boolean;
}

const UpcomingMissionsList: React.FC<UpcomingMissionsListProps> = ({ upcomingMissions, onEdit, onValidate, hidePrices = false }) => {
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false);
  const [swipedMissionId, setSwipedMissionId] = useState<string | null>(null);

  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };

  return (
    <div className="glass-card rounded-xl p-4 md:p-5 animate-slide-in-up">
      <button
        onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-[var(--border-subtle)] bg-white/[0.035] p-2">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
          </span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">À venir</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--border-subtle)] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
            {upcomingMissions.length}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {isUpcomingExpanded ? 'Réduire' : 'Voir'}
          </span>
          {isUpcomingExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </button>

      {isUpcomingExpanded && (
        <div className="animate-slide-in-up mt-4">
          {upcomingMissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-white/[0.02] py-10 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
                <CheckCircle className="text-emerald-400" size={16} />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Tout est à jour !</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Aucune mission en attente</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {upcomingMissions.map((mission, index) => (
                <SwipeableUpcomingMissionCard
                  key={mission.id}
                  mission={mission}
                  onEdit={onEdit}
                  onValidate={onValidate}
                  hidePrices={hidePrices}
                  formatPrice={formatPrice}
                  swipedMissionId={swipedMissionId}
                  onSwipeChange={setSwipedMissionId}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingMissionsList;
