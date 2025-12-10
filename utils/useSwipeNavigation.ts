import React, { useCallback, useRef } from 'react';

interface SwipeOptions {
  enabled?: boolean;
  minDistance?: number;
  maxDuration?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * Détecte un geste de swipe horizontal (gauche/droite) pour la navigation mobile.
 * Ignore les mouvements principalement verticaux pour ne pas bloquer le scroll.
 */
export const useSwipeNavigation = ({
  enabled = true,
  minDistance = 60,
  maxDuration = 800,
  onSwipeLeft,
  onSwipeRight,
}: SwipeOptions) => {
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const deltaRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      deltaRef.current = { x: 0, y: 0 };
    },
    [enabled],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      deltaRef.current = {
        x: touch.clientX - startRef.current.x,
        y: touch.clientY - startRef.current.y,
      };
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    const dx = deltaRef.current.x;
    const dy = deltaRef.current.y;
    const duration = Date.now() - startRef.current.time;

    if (Math.abs(dx) < minDistance) return;
    if (Math.abs(dx) <= Math.abs(dy)) return; // priorité au scroll vertical
    if (duration > maxDuration) return;

    if (dx < 0) {
      onSwipeLeft?.();
    } else if (dx > 0) {
      onSwipeRight?.();
    }
  }, [enabled, minDistance, maxDuration, onSwipeLeft, onSwipeRight]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};

