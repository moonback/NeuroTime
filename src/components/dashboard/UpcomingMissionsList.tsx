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
  mission,
  onEdit,
  onValidate,
  hidePrices,
  formatPrice,
  swipedMissionId,
  onSwipeChange,
  index,
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
      onSwipeChange(mission.id);
    } else {
      setSwipeOffset(0);
      onSwipeChange(null);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [swipeOffset, mission.id, onSwipeChange]);

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
    onSwipeChange(null);
  }, [onSwipeChange]);

  useEffect(() => {
    if (swipedMissionId !== mission.id) {
      setSwipeOffset(0);
    } else if (swipedMissionId === mission.id) {
      setSwipeOffset(-MAX_SWIPE);
    }
  }, [swipedMissionId, mission.id]);

  useEffect(() => {
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

  return (
    <div className="relative overflow-hidden rounded-xl md:rounded-xl">
      {/* Actions rapides révélées par le swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 px-4 bg-gradient-to-l from-primary-500/40 via-primary-500/30 to-transparent pointer-events-none md:hidden">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleActionClick(() => onValidate(mission))}
            className="p-3 rounded-xl bg-green-500 text-white shadow-lg active:scale-95 transition-transform hover:bg-green-600"
            aria-label="Valider"
          >
            <CheckCircle size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleActionClick(() => onEdit(mission))}
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
        className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl glass-light hover:border-primary-500/30 hover:shadow-lg transition-all duration-200 animate-slide-in-up relative bg-dark-200/80 md:bg-transparent"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
          animationDelay: `${index * 50}ms`,
        }}
      >
        {/* Indicateur de swipe (mobile uniquement) */}
        {!isSwiped && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none animate-pulse md:hidden">
            <div className="flex items-center gap-1 text-primary-400">
              <div className="w-1 h-1 rounded-full bg-primary-400"></div>
              <div className="w-1 h-1 rounded-full bg-primary-400"></div>
              <div className="w-1 h-1 rounded-full bg-primary-400"></div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        
        {/* Date Badge */}
        <div 
          onClick={() => onEdit(mission)}
          className="flex cursor-pointer md:flex-col items-center gap-2 md:gap-0 bg-dark-50 p-2.5 md:p-3 rounded-lg min-w-[70px] md:min-w-[80px] text-center border border-dark-200 group-hover:bg-primary-500/20 group-hover:border-primary-500/50 transition-all duration-300 shadow-sm relative z-10 group-hover:scale-105"
        >
          <div className="text-[10px] md:text-xs text-gray-400 group-hover:text-primary-300 uppercase font-bold tracking-wider">
            {format(new Date(mission.startTime), 'MMM', { locale: fr })}
          </div>
          <div className="text-xl md:text-2xl font-black text-gray-100 group-hover:text-primary-300 leading-none md:mt-1">
            {format(new Date(mission.startTime), 'dd')}
          </div>
          <div className="md:hidden h-6 w-[1px] bg-dark-200 mx-2"></div>
          <div className="md:hidden text-base font-bold text-gray-200">
             {format(new Date(mission.startTime), 'HH:mm')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(mission)}>
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-gray-100 text-base md:text-lg truncate group-hover:text-primary-300 transition-colors">{mission.title}</h4>
            {!hidePrices && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex-shrink-0">
                {formatPrice(mission.totalEarnings)}€
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-y-1.5 gap-x-3 mt-2 text-xs md:text-sm text-gray-400">
            <span className="flex items-center gap-1.5 bg-dark-50 px-2 py-0.5 rounded-md border border-dark-200">
              <Clock size={12} className="text-gray-500" />
              {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-gray-500" />
              <span className="truncate max-w-[150px]">{mission.location}</span>
            </span>
             <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium">
               {mission.rateType === 'night' ? <Moon size={10} className="text-primary-400" /> : <Sun size={10} className="text-orange-400" />}
               {mission.rateType === 'night' ? 'Nuit' : 'Jour'}
             </span>
          </div>
        </div>

        {/* Action: Validate (desktop uniquement) */}
        <div className="hidden md:flex items-center justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onValidate(mission);
            }}
            className="flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg font-semibold text-xs md:text-sm transition-all shadow-sm"
            title="Valider les heures"
          >
            <CheckCircle size={14} />
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
    <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
      <button
        onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
        className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2.5">
          <span className="bg-dark-100 p-2 rounded-lg border border-dark-200 group-hover:border-primary-500/50 transition-colors">
             <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-400" />
          </span>
          <h3 className="text-lg md:text-xl font-bold text-gray-100">À venir</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs md:text-sm text-gray-300 font-medium bg-dark-100 px-2.5 py-1 rounded-full border border-dark-200">
            {upcomingMissions.length} en attente
          </span>
          <span className="text-xs md:text-sm text-gray-400">
            {isUpcomingExpanded ? 'Réduire' : 'Déplier'}
          </span>
          {isUpcomingExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {isUpcomingExpanded && (
        <div className="animate-slide-in-up">
          {upcomingMissions.length === 0 ? (
            <div className="text-center py-10 md:py-12 glass-light rounded-xl border border-dashed border-primary-500/20">
              <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-dark-50 rounded-full flex items-center justify-center shadow-sm mb-3 border border-dark-200">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <p className="text-gray-300 font-medium text-sm md:text-base">Tout est à jour !</p>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Aucune mission en attente</p>
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

