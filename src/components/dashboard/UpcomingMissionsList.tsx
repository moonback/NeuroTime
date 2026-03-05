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
      <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 px-3 bg-gradient-to-l from-indigo-500/30 via-indigo-500/20 to-transparent pointer-events-none md:hidden">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => handleActionClick(() => onValidate(mission))}
            className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Valider"
          >
            <CheckCircle size={15} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleActionClick(() => onEdit(mission))}
            className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Modifier"
          >
            <Edit size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-3 p-3 md:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/15 transition-all duration-200 relative"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
          animationDelay: `${index * 40}ms`,
        }}
      >
        {/* Swipe indicator */}
        {!isSwiped && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none md:hidden">
            <div className="flex items-center gap-0.5 text-indigo-400">
              <div className="w-0.5 h-0.5 rounded-full bg-indigo-400" />
              <div className="w-0.5 h-0.5 rounded-full bg-indigo-400" />
              <div className="w-0.5 h-0.5 rounded-full bg-indigo-400" />
            </div>
          </div>
        )}

        {/* Date Badge */}
        <div
          onClick={() => onEdit(mission)}
          className="flex cursor-pointer md:flex-col items-center gap-1.5 md:gap-0 bg-white/[0.03] p-2 md:p-2.5 rounded-lg min-w-[56px] md:min-w-[60px] text-center border border-white/[0.05] group-hover:border-indigo-500/20 transition-all relative z-10"
        >
          <div className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">
            {format(new Date(mission.startTime), 'MMM', { locale: fr })}
          </div>
          <div className="text-lg md:text-xl font-extrabold text-gray-100 leading-none md:mt-0.5">
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
            <h4 className="font-bold text-gray-100 text-[13px] truncate group-hover:text-indigo-300 transition-colors">{mission.title}</h4>
            {!hidePrices && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-300 border border-orange-500/15 flex-shrink-0">
                {formatPrice(mission.totalEarnings)}€
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-y-1 gap-x-2.5 mt-1 text-[10px] text-gray-400">
            <span className="flex items-center gap-1 bg-white/[0.03] px-1.5 py-0.5 rounded-md border border-white/[0.04]">
              <Clock size={10} className="text-gray-500" />
              {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={10} className="text-gray-500" />
              <span className="truncate max-w-[120px]">{mission.location}</span>
            </span>
            <span className="flex items-center gap-1 font-medium">
              {mission.rateType === 'night' ? <Moon size={9} className="text-purple-400" /> : <Sun size={9} className="text-amber-400" />}
              {mission.rateType === 'night' ? 'Nuit' : 'Jour'}
            </span>
          </div>
        </div>

        {/* Validate (desktop) */}
        <div className="hidden md:flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onValidate(mission); }}
            className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg font-semibold text-[10px] transition-all"
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
    <div className="glass-card rounded-xl p-3 md:p-4 animate-slide-in-up">
      <button
        onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
        className="w-full flex items-center justify-between mb-0 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className="bg-white/[0.04] p-1.5 rounded-lg border border-white/[0.06]">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          </span>
          <h3 className="text-xs font-bold text-gray-200">À venir</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-300 font-semibold bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.04]">
            {upcomingMissions.length}
          </span>
          <span className="text-[10px] text-gray-500">
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
        <div className="animate-slide-in-up mt-3">
          {upcomingMissions.length === 0 ? (
            <div className="text-center py-8 bg-white/[0.02] rounded-lg border border-dashed border-white/[0.08]">
              <div className="mx-auto w-8 h-8 bg-white/[0.04] rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="text-emerald-400" size={16} />
              </div>
              <p className="text-gray-300 font-medium text-xs">Tout est à jour !</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Aucune mission en attente</p>
            </div>
          ) : (
            <div className="grid gap-2">
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
