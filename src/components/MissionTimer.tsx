import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Mission } from '../types';
import { differenceInSeconds } from 'date-fns';

interface MissionTimerProps {
  mission: Mission;
  onUpdate: (mission: Mission) => void;
}

export const MissionTimer: React.FC<MissionTimerProps> = ({ mission, onUpdate }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!mission.timerStartedAt) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(mission.timerStartedAt);
    
    // Initial calculation
    setElapsed(differenceInSeconds(new Date(), startTime));

    // Update every second
    const interval = setInterval(() => {
      setElapsed(differenceInSeconds(new Date(), startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [mission.timerStartedAt]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...mission,
      timerStartedAt: new Date().toISOString()
    });
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mission.timerStartedAt) return;

    if (window.confirm("Arrêter le chronomètre ? Cette action ne fait que l'arrêter pour le moment.")) {
       onUpdate({
        ...mission,
        timerStartedAt: undefined
      });
    }
  };

  if (!mission.timerStartedAt && mission.status === 'completed') {
      return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
      mission.timerStartedAt 
        ? 'bg-red-500/20 border border-red-500/50 text-red-400' 
        : 'bg-primary-500/10 border border-primary-500/30 text-primary-400 hover:bg-primary-500/20'
    }`}
    onClick={(e) => e.stopPropagation()}
    >
      {mission.timerStartedAt ? (
        <>
          <span className="font-mono font-medium text-sm animate-pulse">
            {formatTime(elapsed)}
          </span>
          <button 
            onClick={handleStop}
            className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
            title="Arrêter"
          >
            <Square size={14} fill="currentColor" />
          </button>
        </>
      ) : (
        <button 
          onClick={handleStart}
          className="flex items-center gap-1.5"
          title="Démarrer le chronomètre"
        >
          <Clock size={14} />
          <span className="text-xs font-medium">Start</span>
        </button>
      )}
    </div>
  );
};

