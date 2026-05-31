import React, { useEffect, useState, useCallback, useRef } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  minDisplayTime?: number;
  ready?: boolean;
}

// Design tokens via CSS variables (defined in src/index.css)
const FADE_OUT_DURATION = 400;

const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDisplayTime = 1800,
  ready = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFinish = useCallback(() => {
    setIsFadingOut(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, FADE_OUT_DURATION);
  }, [onFinish]);

  useEffect(() => {
    if (!ready) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    const checkFinish = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      timeoutRef.current = setTimeout(() => {
        setProgress(100);
        setTimeout(handleFinish, 200);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      checkFinish();
    } else {
      window.addEventListener('load', checkFinish);
      return () => {
        window.removeEventListener('load', checkFinish);
        clearInterval(progressInterval);
      };
    }

    return () => {
      clearInterval(progressInterval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [ready, minDisplayTime, handleFinish]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-[var(--bg-start, #0a0a0f)] via-[var(--bg-mid, #0d0d14)] to-[var(--bg-end, #0a0a0f)] flex items-center justify-center overflow-hidden"
      role="status"
      aria-label="Chargement de l'application NeuroTime"
      style={{
        animation: isVisible && !isFadingOut ? 'fadeIn 0.6s ease-out' : 'fadeOut 0.6s ease-in forwards',
        willChange: isFadingOut ? 'opacity' : 'auto',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <img src="/logo.png" alt="Logo" className="h-24 sm:h-28 md:h-32 w-auto object-contain" draggable={false} />
        <p
          className="text-white/90 text-sm sm:text-base md:text-lg font-semibold"
          style={{
            animation: 'slideUp 0.8s ease-out 0.5s backwards',
            textShadow: '0 0 12px rgba(99,102,241,0.5)',
          }}
        >
          Gérez votre temps, maximisez vos gains.
        </p>
        <div className="w-56 sm:w-64 md:w-72 h-1.5 bg-white/5 backdrop-blur-md rounded-full overflow-hidden border border-white/10 shadow-lg">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-[var(--accent)] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-white/90 text-sm font-semibold" aria-live="polite">
            Chargement
          </p>
          <div className="flex gap-2" role="progressbar" aria-label="Chargement">
            {[0, 0.2, 0.4].map((delay, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[var(--accent)] rounded-full"
                style={{
                  animation: 'dotPulse 1.4s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotPulse { 0%, 100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.2); } }
      `}</style>
    </div>
  );
};

export default SplashScreen;