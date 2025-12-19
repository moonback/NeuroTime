import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  maxSwipe?: number;
  disabled?: boolean;
}

interface UseSwipeReturn {
  swipeOffset: number;
  isSwiped: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  resetSwipe: () => void;
}

export const useSwipe = (
  swipedId: string | null,
  currentId: string,
  onSwipeChange: (id: string | null) => void,
  options: UseSwipeOptions = {}
): UseSwipeReturn => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 80,
    maxSwipe = 200,
    disabled = false,
  } = options;

  const [swipeOffset, setSwipeOffset] = useState(0);
  const isSwiped = swipedId === currentId;
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const SWIPE_ANGLE_THRESHOLD = 0.5;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isSwiping.current = false;
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || touchStartX.current === null || touchStartY.current === null) return;

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

        if (deltaX < 0 && onSwipeLeft) {
          const offset = Math.max(-maxSwipe, deltaX);
          setSwipeOffset(offset);
        } else if (deltaX > 0 && isSwiped && onSwipeRight) {
          const offset = Math.min(0, deltaX);
          setSwipeOffset(offset);
        } else if (deltaX < 0) {
          const offset = Math.max(-maxSwipe, deltaX);
          setSwipeOffset(offset);
        } else if (deltaX > 0 && isSwiped) {
          const offset = Math.min(0, deltaX);
          setSwipeOffset(offset);
        }
      }
    },
    [disabled, isSwiped, maxSwipe, onSwipeLeft, onSwipeRight]
  );

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;

    if (swipeOffset < -threshold) {
      setSwipeOffset(-maxSwipe);
      onSwipeChange(currentId);
      onSwipeLeft?.();
    } else {
      setSwipeOffset(0);
      onSwipeChange(null);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  }, [swipeOffset, threshold, maxSwipe, currentId, onSwipeChange, onSwipeLeft]);

  const resetSwipe = useCallback(() => {
    setSwipeOffset(0);
    onSwipeChange(null);
  }, [onSwipeChange]);

  useEffect(() => {
    if (swipedId !== currentId) {
      setSwipeOffset(0);
    } else if (swipedId === currentId) {
      setSwipeOffset(-maxSwipe);
    }
  }, [swipedId, currentId, maxSwipe]);

  return {
    swipeOffset,
    isSwiped,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetSwipe,
  };
};

