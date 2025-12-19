import React, { useState, useRef, TouchEvent } from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void; // Usually Delete
  onSwipeRight?: () => void; // Usually Complete
  leftActionColor?: string;
  rightActionColor?: string;
  leftActionIcon?: React.ReactNode;
  rightActionIcon?: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionColor = 'bg-emerald-500',
  rightActionColor = 'bg-red-500',
  leftActionIcon = <CheckCircle2 size={24} className="text-white" />,
  rightActionIcon = <Trash2 size={24} className="text-white" />,
  threshold = 80,
  disabled = false
}) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false); // True if horizontal swipe detected
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
    setIsSwiping(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startX === null || startY === null || !isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX;
    const diffY = currentY - startY;

    // Determine if scrolling or swiping
    if (!isSwiping) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
        setIsSwiping(true);
      } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
        // Vertical scroll, cancel swipe
        setIsDragging(false);
        return;
      }
    }

    if (isSwiping) {
      // Prevent default scrolling only if we are sure it's a swipe
      // Note: e.preventDefault() cannot be called here easily in React 18+ with passive events
      // So we rely on touch-action: pan-y css property on the element
      
      // Limit swipe directions based on available actions
      if (diffX > 0 && !onSwipeRight) return;
      if (diffX < 0 && !onSwipeLeft) return;

      // Resistance effect
      const resistedDiff = diffX * 0.6; 
      setTranslateX(resistedDiff);
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (translateX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    setTranslateX(0);
    setStartX(null);
    setStartY(null);
    setIsDragging(false);
    setIsSwiping(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl touch-pan-y select-none">
      {/* Background Actions */}
      <div className={`absolute inset-0 flex items-center justify-between pointer-events-none rounded-2xl`}>
         {/* Left Action (Swipe Right to see) - Complete */}
         <div className={`absolute left-0 top-0 bottom-0 w-full flex items-center justify-start px-6 ${leftActionColor} rounded-2xl transition-opacity duration-200`}
              style={{ opacity: translateX > 0 ? Math.min(translateX / (threshold * 0.8), 1) : 0 }}>
            <div className="scale-110 transform transition-transform duration-200" style={{ transform: `scale(${Math.min(1 + (translateX / 200), 1.2)})` }}>
               {leftActionIcon}
            </div>
         </div>
         
         {/* Right Action (Swipe Left to see) - Delete */}
         <div className={`absolute right-0 top-0 bottom-0 w-full flex items-center justify-end px-6 ${rightActionColor} rounded-2xl transition-opacity duration-200`}
              style={{ opacity: translateX < 0 ? Math.min(Math.abs(translateX) / (threshold * 0.8), 1) : 0 }}>
            <div className="scale-110 transform transition-transform duration-200" style={{ transform: `scale(${Math.min(1 + (Math.abs(translateX) / 200), 1.2)})` }}>
              {rightActionIcon}
            </div>
         </div>
      </div>

      {/* Content */}
      <div
        ref={itemRef}
        className="relative z-10 transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
