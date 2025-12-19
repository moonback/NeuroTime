import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  minDisplayTime?: number;
  ready?: boolean;
}

const CIRCUIT_LINES = 20;
const DOTS_PER_LINE = 8;
const FADE_OUT_DURATION = 400;
const CIRCUIT_ANGLE_STEP = 18;
const CIRCUIT_LENGTH = 38;

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  minDisplayTime = 1800, 
  ready = true 
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

    // Simuler une progression
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [ready, minDisplayTime, handleFinish]);

  const circuitElements = useMemo(() => {
    return Array.from({ length: CIRCUIT_LINES }, (_, i) => {
      const angle = (i * CIRCUIT_ANGLE_STEP) * Math.PI / 180;
      const x2 = 50 + Math.cos(angle) * CIRCUIT_LENGTH;
      const y2 = 50 + Math.sin(angle) * CIRCUIT_LENGTH;
      
      const dots = Array.from({ length: DOTS_PER_LINE }, (_, j) => {
        const progress = (j + 1) / DOTS_PER_LINE;
        const dotX = 50 + Math.cos(angle) * CIRCUIT_LENGTH * progress;
        const dotY = 50 + Math.sin(angle) * CIRCUIT_LENGTH * progress;
        return { x: dotX, y: dotY };
      });

      return { angle, x2, y2, dots, delay: i * 0.1 };
    });
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] flex items-center justify-center overflow-hidden"
      role="status"
      aria-label="Chargement de l'application NeuroTime"
      style={{
        animation: isVisible && !isFadingOut ? 'fadeIn 0.5s ease-out' : 'fadeOut 0.5s ease-in forwards',
        willChange: isFadingOut ? 'opacity' : 'auto'
      }}
    >
      {/* Animated Background Gradients - Multi-layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,140,255,0.15) 0%, rgba(0,140,255,0.05) 40%, transparent 70%)',
          animation: 'breathe 6s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 30% 70%, rgba(0,212,255,0.1) 0%, transparent 50%)',
          animation: 'breathe 8s ease-in-out infinite 2s'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 70% 30%, rgba(0,102,255,0.08) 0%, transparent 50%)',
          animation: 'breathe 7s ease-in-out infinite 1s'
        }}
      />

      {/* Animated Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,140,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,140,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}
      />

      {/* Circuit Board / Neural Network Background */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        style={{ 
          opacity: 0.6, 
          filter: 'blur(0.5px)',
          willChange: 'opacity'
        }}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#008CFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#76CCFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#008CFF" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#008CFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Circuit lines radiating from center */}
        {circuitElements.map((circuit, i) => (
          <g key={i}>
            <line
              x1="50"
              y1="50"
              x2={circuit.x2}
              y2={circuit.y2}
              stroke="url(#circuitGradient)"
              strokeWidth="0.3"
              strokeLinecap="round"
              className="circuit-line"
              opacity="0"
              filter="url(#glow)"
              style={{
                animationDelay: `${circuit.delay}s`
              }}
            />
            {circuit.dots.map((dot, j) => (
              <circle
                key={j}
                cx={dot.x}
                cy={dot.y}
                r="0.8"
                fill="#00D4FF"
                opacity="0"
                className="circuit-dot"
                filter="url(#glow)"
                style={{
                  animationDelay: `${circuit.delay + j * 0.05}s`
                }}
              />
            ))}
          </g>
        ))}
        
        {/* Enhanced curved connecting paths */}
        <path
          d="M 25 25 Q 35 40, 50 50 T 75 25"
          fill="none"
          stroke="url(#accentGradient)"
          strokeWidth="0.25"
          opacity="0.6"
          className="circuit-path"
          filter="url(#glow)"
        />
        <path
          d="M 25 75 Q 35 60, 50 50 T 75 75"
          fill="none"
          stroke="url(#accentGradient)"
          strokeWidth="0.25"
          opacity="0.6"
          className="circuit-path"
          filter="url(#glow)"
        />
        <path
          d="M 20 40 Q 30 50, 50 50 T 80 40"
          fill="none"
          stroke="url(#circuitGradient)"
          strokeWidth="0.2"
          opacity="0.5"
          className="circuit-path"
          filter="url(#glow)"
        />
        <path
          d="M 20 60 Q 30 50, 50 50 T 80 60"
          fill="none"
          stroke="url(#circuitGradient)"
          strokeWidth="0.2"
          opacity="0.5"
          className="circuit-path"
          filter="url(#glow)"
        />
      </svg>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 sm:gap-8 md:gap-10 px-4 sm:px-6 md:px-8 max-w-4xl">
        {/* Logo with glow effect */}
        <div className="relative flex-shrink-0">
          {/* Glow behind logo */}
          <div 
            className="absolute inset-0 blur-3xl opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(0,140,255,0.4) 0%, transparent 70%)',
              animation: 'logoGlow 3s ease-in-out infinite',
              transform: 'scale(1.5)'
            }}
          />
          <div 
            className="relative z-10"
            style={{
              animation: 'scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-28 sm:h-32 md:h-40 w-auto object-contain drop-shadow-[0_0_30px_rgba(0,140,255,0.5)]"
              draggable={false}
            />
          </div>
        </div>

        {/* Text Content with stagger animation */}
        <div className="flex flex-col justify-center items-center text-center">
          {/* Tagline */}
          <p 
            className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-semibold leading-relaxed tracking-wide"
            style={{
              animation: 'slideUp 0.8s ease-out 0.5s backwards',
              textShadow: '0 0 20px rgba(0,140,255,0.5), 0 2px 10px rgba(0,140,255,0.3)'
            }}
          >
            Gérez votre temps, maximisez vos gains.
          </p>

          {/* Enhanced accent line */}
          <div 
            className="mt-5 h-0.5 bg-gradient-to-r from-transparent via-[#008CFF] to-transparent rounded-full relative"
            style={{
              width: '240px',
              animation: 'expandWidth 1s ease-out 0.7s backwards',
              boxShadow: '0 0 30px rgba(0,140,255,0.8), 0 0 60px rgba(0,212,255,0.4)'
            }}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent rounded-full"
              style={{
                animation: 'pulseGlow 2s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Loading Indicator */}
      <div 
        className="absolute bottom-8 sm:bottom-10 md:bottom-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4"
        style={{
          animation: 'slideUp 0.8s ease-out 0.9s backwards'
        }}
      >
        {/* Progress bar with glassmorphism */}
        <div className="w-56 sm:w-64 md:w-72 h-2 bg-white/5 backdrop-blur-md rounded-full overflow-hidden border border-white/10 shadow-lg">
          <div 
            className="h-full bg-gradient-to-r from-[#008CFF] via-[#76CCFF] to-[#00D4FF] rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{
              width: `${Math.min(progress, 100)}%`,
              boxShadow: '0 0 30px rgba(0,140,255,0.9), inset 0 0 20px rgba(255,255,255,0.2)'
            }}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: 'shimmer 2s ease-in-out infinite',
                transform: 'translateX(-100%)'
              }}
            />
          </div>
        </div>

        {/* Loading text and dots */}
        <div className="flex items-center gap-3">
          <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold tracking-wide" aria-live="polite">
            Chargement
          </p>
          <div className="flex gap-2" role="progressbar" aria-label="Chargement">
            {[0, 0.2, 0.4].map((delay, index) => (
              <div 
                key={index}
                className="w-2 h-2 bg-[#00D4FF] rounded-full"
                style={{
                  animation: 'dotBounce 1.4s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  boxShadow: '0 0 15px rgba(0,212,255,1), 0 0 30px rgba(0,140,255,0.6)'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }
        
        @keyframes fadeOut {
          from { 
            opacity: 1; 
          }
          to { 
            opacity: 0; 
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.6) rotate(-5deg);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
            filter: blur(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes expandWidth {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 240px;
            opacity: 1;
          }
        }
        

        @keyframes breathe {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.15);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        
        @keyframes dotBounce {
          0%, 100% { 
            opacity: 0.5; 
            transform: translateY(0) scale(1);
          }
          50% { 
            opacity: 1; 
            transform: translateY(-10px) scale(1.3);
          }
        }

        @keyframes logoGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1.5);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.7);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
          }
        }
        
        @keyframes circuitFlow {
          0% {
            stroke-dasharray: 0 1000;
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            stroke-dasharray: 1000 0;
            opacity: 0;
          }
        }

        @keyframes circuitPathFlow {
          0% {
            stroke-dasharray: 0 1000;
            opacity: 0;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            stroke-dasharray: 1000 0;
            opacity: 0;
          }
        }
        
        .circuit-line {
          animation: circuitFlow 5s ease-in-out infinite;
          will-change: stroke-dasharray, opacity;
        }

        .circuit-path {
          animation: circuitPathFlow 6s ease-in-out infinite;
          will-change: stroke-dasharray, opacity;
        }
        
        .circuit-dot {
          animation: fadeIn 1s ease-out;
        }
        
        /* Optimisation pour les appareils à faible performance */
        @media (prefers-reduced-motion: reduce) {
          .circuit-line,
          .circuit-dot,
          .circuit-path {
            animation: none !important;
            opacity: 0.6 !important;
          }
          
          [style*="animation"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;