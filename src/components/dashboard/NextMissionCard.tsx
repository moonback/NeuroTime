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
      <div className="glass-card rounded-2xl p-5 border border-orange-500/20 bg-gradient-to-br from-orange-600/10 via-orange-500/5 to-orange-400/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200">
            <Calendar size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-orange-100">Aucune mission planifiée</p>
            <p className="text-xs text-gray-500 font-medium">Ajoutez une mission pour commencer</p>
          </div>
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

  // Ajouter les écouteurs avec passive: false pour permettre preventDefault
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
    <div className="relative overflow-hidden rounded-2xl md:rounded-2xl">
      {/* Actions rapides révélées par le swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 bg-gradient-to-l from-primary-500/40 via-primary-500/30 to-transparent pointer-events-none md:hidden">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleActionClick(() => onValidate(nextMission))}
            className="p-3 rounded-xl bg-green-500 text-white shadow-lg active:scale-95 transition-transform hover:bg-green-600"
            aria-label="Valider"
          >
            <CheckCircle size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleActionClick(() => onEdit(nextMission))}
            className="p-3 rounded-xl bg-primary-500 text-white shadow-lg active:scale-95 transition-transform hover:bg-primary-600"
            aria-label="Modifier"
          >
            <Edit size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Carte principale */}
      <div
        ref={cardRef}
        onClick={() => onEdit(nextMission)}
        className="group relative overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 active:scale-[0.99] cursor-pointer"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[#0f141f]" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 border border-orange-500/20 group-hover:border-orange-500/40 rounded-3xl transition-colors duration-500" />

        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/10 blur-[80px] rounded-full group-hover:bg-orange-600/20 transition-all duration-500" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Date Block */}
          <div className="flex-shrink-0 flex md:flex-col items-center justify-center gap-1 bg-gradient-to-b from-orange-400 to-orange-600 p-[1px] rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-500">
            <div className="bg-[#0f141f] rounded-[15px] px-4 py-3 md:min-w-[85px] text-center">
              <span className="block text-[10px] uppercase font-black text-orange-400 tracking-[0.2em] mb-1">
                {format(missionStart, 'MMM', { locale: fr })}
              </span>
              <span className="block text-3xl font-black text-white leading-none tracking-tighter">
                {format(missionStart, 'dd')}
              </span>
              <span className="block text-[11px] font-bold text-gray-400 mt-2">
                {format(missionStart, 'HH:mm')}
              </span>
            </div>
          </div>

          {/* Info Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isOngoing
                  ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse'
                  : 'bg-white/5 text-orange-300 border-white/10'
                }`}>
                {isOngoing ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    En cours
                  </>
                ) : timeText}
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-gray-400">
                  {nextMission.rateType === 'night' ? <Moon size={12} className="text-purple-400" /> : nextMission.rateType === 'mixed' ? <Clock size={12} className="text-indigo-400" /> : <Sun size={12} className="text-yellow-400" />}
                  <span className="text-[10px] font-bold uppercase">{nextMission.rateType === 'night' ? 'Nuit' : nextMission.rateType === 'mixed' ? 'Mixte' : 'Jour'}</span>
                </div>
                {!hidePrices && (
                  <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs">
                    {formatPrice(nextMission.totalEarnings)}€
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tighter transition-colors group-hover:text-orange-50 filter drop-shadow-sm">
              {nextMission.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {nextMission.client && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-orange-200/90 text-xs font-bold">
                  <Briefcase size={14} className="text-orange-400" />
                  <span>{nextMission.client}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <Clock size={14} className="text-gray-500" />
                <span>{formatTimeSlots(nextMission)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <MapPin size={14} className="text-gray-500" />
                <span className="truncate max-w-[200px]">{nextMission.location}</span>
              </div>
            </div>
          </div>

          {/* Action Row - Desktop */}
          <div className="hidden md:flex flex-col gap-3 pl-6 border-l border-white/10">
            <button
              onClick={(e) => { e.stopPropagation(); onValidate(nextMission); }}
              className="group/btn relative px-6 py-3 rounded-2xl overflow-hidden font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-emerald-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center justify-center gap-2 text-white">
                <CheckCircle size={16} strokeWidth={3} />
                <span>Terminer</span>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(nextMission); }}
              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
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

