import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Calendar, MapPin, Clock, Moon, Sun, Briefcase, Edit, CheckCircle } from 'lucide-react';
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
      <div className="glass-card flex items-center gap-4 rounded-xl p-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.035] p-3 text-[var(--warning)]">
          <Calendar size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Aucune mission planifiée</p>
          <p className="text-xs text-[var(--text-muted)]">Ajoutez une mission pour alimenter votre planning.</p>
        </div>
      </div>
    );
  }

  const missionStart = new Date(nextMission.startTime);
  const missionEnd = new Date(nextMission.endTime);
  const now = new Date();
  const isOngoing = now >= missionStart && now < missionEnd;

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
      if (!isSwiping.current) isSwiping.current = true;
      e.preventDefault();

      if (deltaX < 0) {
        setSwipeOffset(Math.max(-MAX_SWIPE, deltaX));
      } else if (deltaX > 0 && isSwiped) {
        setSwipeOffset(Math.min(0, deltaX));
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
    <section className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 bg-[var(--bg-elevated)] pointer-events-none md:hidden">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleActionClick(() => onValidate(nextMission))}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--success)] text-white active:scale-95"
            aria-label="Valider"
          >
            <CheckCircle size={17} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleActionClick(() => onEdit(nextMission))}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white active:scale-95"
            aria-label="Modifier"
          >
            <Edit size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div
        ref={cardRef}
        onClick={() => onEdit(nextMission)}
        className="glass-card group cursor-pointer rounded-xl p-4 md:p-5"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex shrink-0 items-center gap-3 md:block">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-center md:min-w-[72px] md:px-4 md:py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {format(missionStart, 'MMM', { locale: fr })}
              </span>
              <span className="block text-2xl font-semibold leading-none tracking-[-0.045em] text-[var(--text-primary)] md:text-3xl">
                {format(missionStart, 'dd')}
              </span>
              <span className="mt-1 block text-[11px] font-medium text-[var(--text-muted)]">
                {format(missionStart, 'HH:mm')}
              </span>
            </div>
            <div className="md:hidden">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Prochaine mission</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{timeText}</p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${isOngoing
                ? 'border-orange-500/25 bg-orange-500/12 text-[var(--warning)]'
                : 'border-[var(--border-subtle)] bg-white/[0.035] text-[var(--text-secondary)]'
                }`}>
                {isOngoing && <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />}
                {isOngoing ? 'En cours' : timeText}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                {nextMission.rateType === 'night'
                  ? <Moon size={11} className="text-[var(--accent)]" />
                  : nextMission.rateType === 'mixed'
                    ? <Clock size={11} className="text-[var(--accent)]" />
                    : <Sun size={11} className="text-[var(--warning)]" />}
                {nextMission.rateType === 'night' ? 'Nuit' : nextMission.rateType === 'mixed' ? 'Mixte' : 'Jour'}
              </span>

              {!hidePrices && (
                <span className="num-financial inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                  {formatPrice(nextMission.totalEarnings)}€
                </span>
              )}
            </div>

            <h3 className="mb-2 truncate text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-2xl">
              {nextMission.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-[var(--text-secondary)]">
              {nextMission.client && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={13} className="text-[var(--text-muted)]" />
                  {nextMission.client}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--text-muted)]" />
                {formatTimeSlots(nextMission)}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin size={13} className="shrink-0 text-[var(--text-muted)]" />
                <span className="truncate max-w-[220px]">{nextMission.location}</span>
              </span>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 border-l border-[var(--border-subtle)] pl-5 md:flex">
            <button
              onClick={(e) => { e.stopPropagation(); onValidate(nextMission); }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--success)] px-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              <CheckCircle size={15} strokeWidth={2.5} />
              Terminer
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(nextMission); }}
              className="btn-secondary min-h-10 px-4 text-sm font-semibold"
            >
              Modifier
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NextMissionCard;
