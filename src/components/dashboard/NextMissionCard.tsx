import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Calendar, MapPin, Clock, Moon, Sun, Briefcase, Euro, Edit, CheckCircle, Navigation } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes, isToday, isTomorrow, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Mission } from '../../types';
import { formatTimeSlots } from '../../utils/timeSlots';

interface NextMissionCardProps {
  nextMission: Mission | null;
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  hidePrices?: boolean;
}

const NextMissionCard: React.FC<NextMissionCardProps> = ({ nextMission, onEdit, onValidate, hidePrices = false }) => {

  const formatPrice = (value: number | null | undefined): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(0);
  };

  if (!nextMission) {
    return (
      <div className="glass-card rounded-xl p-3.5 border border-orange-500/15 bg-gradient-to-br from-orange-600/5 to-transparent flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/15 text-orange-300">
          <Calendar size={16} strokeWidth={2} />
        </div>
        <div>
          <p className="text-xs font-bold text-orange-100">Aucune mission planifiée</p>
          <p className="text-[10px] text-gray-500">Ajoutez une mission pour commencer</p>
        </div>
      </div>
    );
  }

  const missionStart = new Date(nextMission.startTime);
  const missionEnd = new Date(nextMission.endTime);
  const now = new Date();
  const isOngoing = now >= missionStart && now < missionEnd;

  // Calcul du temps restant compact
  let timeText = '';
  if (isOngoing) {
    const hoursLeft = differenceInHours(missionEnd, now);
    const minutesLeft = differenceInMinutes(missionEnd, now) % 60;
    timeText = hoursLeft === 0 ? `${minutesLeft} min rest.` : `${hoursLeft}h rest.`;
  } else {
    const hoursUntil = differenceInHours(missionStart, now);
    const minutesUntil = differenceInMinutes(missionStart, now);
    const daysUntil = differenceInCalendarDays(missionStart, now);

    if (minutesUntil < 60) timeText = `Dans ${minutesUntil} min`;
    else if (isToday(missionStart)) timeText = `Aujourd'hui +${hoursUntil}h`;
    else if (isTomorrow(missionStart)) timeText = 'Demain';
    else timeText = `Dans ${daysUntil}j`;
  }

  // Swipe logic pour mobile
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
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
      if (!isSwiping.current) {
        isSwiping.current = true;
      }
      e.preventDefault();

      if (deltaX < 0) {
        const offset = Math.max(-MAX_SWIPE, deltaX);
        setSwipeOffset(offset);
      } else if (deltaX > 0 && isSwiped) {
        const offset = Math.min(0, deltaX);
        setSwipeOffset(offset);
      }
    }
  }, [isSwiped]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;

    if (swipeOffset < -SWIPE_THRESHOLD) {
      setSwipeOffset(-MAX_SWIPE);
      setIsSwiped(true);
    } else {
      setSwipeOffset(0);
      setIsSwiped(false);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [swipeOffset]);

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
    setIsSwiped(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isSwiped && cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSwipeOffset(0);
        setIsSwiped(false);
      }
    };

    const handleScroll = () => {
      if (isSwiped) {
        setSwipeOffset(0);
        setIsSwiped(false);
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
  }, [isSwiped]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Actions rapides révélées par le swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 px-3 bg-gradient-to-l from-indigo-500/30 via-indigo-500/20 to-transparent pointer-events-none md:hidden">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => handleActionClick(() => onValidate(nextMission))}
            className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Valider"
          >
            <CheckCircle size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleActionClick(() => onEdit(nextMission))}
            className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Modifier"
          >
            <Edit size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Carte principale */}
      <div
        ref={cardRef}
        onClick={() => onEdit(nextMission)}
        className="group relative overflow-hidden rounded-xl p-3.5 md:p-4 transition-all duration-300 cursor-pointer active:scale-[0.995]"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-[#0c0f1a]" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 border border-white/[0.05] group-hover:border-indigo-500/15 rounded-xl transition-colors duration-300" />

        {/* Subtle glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/[0.04] blur-[60px] rounded-full group-hover:bg-indigo-500/[0.08] transition-all duration-500" />

        <div className="relative z-10 flex flex-col md:flex-row gap-3 md:gap-5 items-start md:items-center">
          {/* Date Block — COMPACT */}
          <div className="flex-shrink-0 flex md:flex-col items-center gap-1 bg-white/[0.04] p-px rounded-lg border border-white/[0.06] group-hover:border-indigo-500/20 transition-all">
            <div className="bg-[#0c0f1a] rounded-[7px] px-2.5 py-1.5 md:min-w-[56px] text-center">
              <span className="block text-[8px] uppercase font-bold text-indigo-400 tracking-wider mb-0.5">
                {format(missionStart, 'MMM', { locale: fr })}
              </span>
              <span className="block text-lg font-extrabold text-white leading-none tracking-tight">
                {format(missionStart, 'dd')}
              </span>
              <span className="block text-[8px] font-semibold text-gray-500 mt-1 opacity-60">
                {format(missionStart, 'HH:mm')}
              </span>
            </div>
          </div>

          {/* Info Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${isOngoing
                ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)] animate-pulse'
                : 'bg-white/[0.04] text-orange-300 border-white/[0.06]'
                }`}>
                {isOngoing ? (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    En cours
                  </>
                ) : timeText}
              </span>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.04] text-gray-400">
                  {nextMission.rateType === 'night' ? <Moon size={10} className="text-purple-400" /> : nextMission.rateType === 'mixed' ? <Clock size={10} className="text-indigo-400" /> : <Sun size={10} className="text-amber-400" />}
                  <span className="text-[9px] font-semibold">{nextMission.rateType === 'night' ? 'Nuit' : nextMission.rateType === 'mixed' ? 'Mixte' : 'Jour'}</span>
                </div>
                {!hidePrices && (
                  <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                    {formatPrice(nextMission.totalEarnings)}€
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-base md:text-lg font-extrabold text-white mb-1.5 tracking-tight transition-colors group-hover:text-indigo-300 leading-tight">
              {nextMission.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {nextMission.client && (
                <div className="flex items-center gap-1 text-orange-200/80 text-[10px] font-semibold">
                  <Briefcase size={11} className="text-orange-400" />
                  <span>{nextMission.client}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium">
                <Clock size={11} className="text-gray-500" />
                <span>{formatTimeSlots(nextMission)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium">
                <MapPin size={11} className="text-gray-500" />
                <span className="truncate max-w-[150px]">{nextMission.location}</span>
              </div>
            </div>
          </div>

          {/* Action Row - Desktop */}
          <div className="hidden md:flex flex-col gap-2 pl-4 border-l border-white/[0.06]">
            <button
              onClick={(e) => { e.stopPropagation(); onValidate(nextMission); }}
              className="group/btn relative px-4 py-2 rounded-xl overflow-hidden font-bold text-[10px] uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="absolute inset-0 bg-emerald-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center justify-center gap-1.5 text-white">
                <CheckCircle size={14} strokeWidth={2.5} />
                <span>Terminer</span>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(nextMission); }}
              className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-300 font-semibold text-[10px] uppercase tracking-wider hover:bg-white/[0.08] transition-all active:scale-95"
            >
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextMissionCard;
