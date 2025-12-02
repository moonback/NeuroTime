import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  minDisplayTime?: number;
  ready?: boolean;
}

const CIRCUIT_LINES = 16;
const DOTS_PER_LINE = 6;
const FADE_OUT_DURATION = 300;
const CIRCUIT_ANGLE_STEP = 22.5;
const CIRCUIT_LENGTH = 35;

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  minDisplayTime = 1500, 
  ready = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
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

    const checkFinish = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      timeoutRef.current = setTimeout(() => {
        handleFinish();
      }, remaining);
    };

    if (document.readyState === 'complete') {
      checkFinish();
    } else {
      window.addEventListener('load', checkFinish);
      return () => {
        window.removeEventListener('load', checkFinish);
      };
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [ready, minDisplayTime, handleFinish]);

  // Mémoriser les calculs SVG pour éviter les recalculs
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

      return { angle, x2, y2, dots };
    });
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex items-center justify-center overflow-hidden"
      role="status"
      aria-label="Chargement de l'application NeuroTime"
      style={{
        animation: isVisible && !isFadingOut ? 'fadeIn 0.3s ease-in' : 'fadeOut 0.3s ease-out forwards',
        willChange: isFadingOut ? 'opacity' : 'auto'
      }}
    >
      {/* Circuit Board / Neural Network Background */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ 
          opacity: 0.4, 
          filter: 'blur(0.5px)',
          willChange: 'opacity'
        }}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#008CFF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#76CCFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#008CFF" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Circuit lines radiating from center with neural network pattern */}
        {circuitElements.map((circuit, i) => (
          <g key={i} filter="url(#glow)">
            <line
              x1="50%"
              y1="50%"
              x2={`${circuit.x2}%`}
              y2={`${circuit.y2}%`}
              stroke="url(#circuitGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              className="circuit-line"
              opacity="0.7"
            />
            {/* Dots along the line */}
            {circuit.dots.map((dot, j) => (
              <circle
                key={j}
                cx={`${dot.x}%`}
                cy={`${dot.y}%`}
                r="2.5"
                fill="#008CFF"
                opacity="0.7"
                className="circuit-dot"
              />
            ))}
          </g>
        ))}
        
        {/* Curved connecting paths for neural network effect */}
        <path
          d="M 25% 25% Q 35% 40%, 50% 50% T 75% 25%"
          fill="none"
          stroke="url(#circuitGradient)"
          strokeWidth="1.5"
          opacity="0.5"
          className="circuit-line"
          filter="url(#glow)"
        />
        <path
          d="M 25% 75% Q 35% 60%, 50% 50% T 75% 75%"
          fill="none"
          stroke="url(#circuitGradient)"
          strokeWidth="1.5"
          opacity="0.5"
          className="circuit-line"
          filter="url(#glow)"
        />
        <path
          d="M 20% 40% Q 30% 50%, 50% 50% T 80% 40%"
          fill="none"
          stroke="url(#circuitGradient)"
          strokeWidth="1"
          opacity="0.4"
          className="circuit-line"
        />
        <path
          d="M 20% 60% Q 30% 50%, 50% 50% T 80% 60%"
          fill="none"
          stroke="url(#circuitGradient)"
          strokeWidth="1"
          opacity="0.4"
          className="circuit-line"
        />
      </svg>

      {/* Main Content Container - Horizontal Layout */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-10 px-4 sm:px-6 md:px-8 max-w-4xl">
        {/* Logo - Left side */}
        <div className="relative flex-shrink-0">
          {/* Glow effect behind logo */}
          <div 
            className="absolute inset-0 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(0,140,255,0.6) 0%, transparent 70%)',
              width: '150%',
              height: '150%',
              top: '-25%',
              left: '-25%',
              animation: 'pulseGlow 2s ease-in-out infinite'
            }}
          />
          
          {/* Logo container */}
          <div className="relative z-10">
            <img
              src="/logo2.png"
              alt="NeuroTime Logo"
              className="h-24 w-24 sm:h-28 sm:w-28 md:h-36 md:w-36 object-contain"
              style={{
                filter: 'drop-shadow(0 0 25px rgba(0,140,255,0.9)) drop-shadow(0 0 50px rgba(0,140,255,0.5))',
                animation: 'float 3s ease-in-out infinite',
                willChange: 'transform'
              }}
              loading="eager"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Text Content - Right side */}
        <div className="flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
          {/* App Name */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-none">
            <span 
              className="inline-block"
              style={{
                background: 'linear-gradient(to right, #008CFF 0%, #76CCFF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 15px rgba(0,140,255,0.6))',
                letterSpacing: '-0.02em',
                fontWeight: 700
              }}
            >
              NeuroTime
            </span>
          </h1>
          
          {/* Tagline */}
          <p className="text-white/70 text-xs sm:text-sm md:text-base lg:text-lg font-medium mt-2 sm:mt-3 leading-relaxed">
            Gérez votre temps, maximisez vos gains.
          </p>
        </div>
      </div>

      {/* Loading Indicator - Bottom */}
      <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-white/60 text-xs sm:text-sm md:text-base font-medium" aria-live="polite">
          Chargement en cours
          <span className="loading-dots" aria-hidden="true">...</span>
        </p>
        <div className="flex gap-2 mt-1" role="progressbar" aria-label="Chargement">
          {[0, 0.2, 0.4].map((delay, index) => (
            <div 
              key={index}
              className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#008CFF] rounded-full"
              style={{
                animation: 'dotPulse 1.4s ease-in-out infinite',
                animationDelay: `${delay}s`,
                boxShadow: '0 0 10px rgba(0,140,255,0.9), 0 0 20px rgba(0,140,255,0.5)',
                willChange: 'opacity, transform'
              }}
            />
          ))}
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
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px); 
          }
          50% { 
            transform: translateY(-8px); 
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 0.5; 
            transform: scale(1.5);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.6);
          }
        }
        
        @keyframes dotPulse {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(0.8);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2);
          }
        }
        
        @keyframes circuitFlow {
          0% {
            stroke-dasharray: 0 1000;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dasharray: 1000 0;
            opacity: 0;
          }
        }
        
        .circuit-line {
          animation: circuitFlow 4s ease-in-out infinite;
          will-change: stroke-dasharray, opacity;
        }
        
        .circuit-dot {
          animation: pulseGlow 2s ease-in-out infinite;
          will-change: opacity, transform;
        }
        
        @keyframes loadingDots {
          0%, 20% {
            content: '.';
          }
          40% {
            content: '..';
          }
          60%, 100% {
            content: '...';
          }
        }
        
        .loading-dots::after {
          content: '...';
          animation: loadingDots 1.5s steps(4, end) infinite;
        }
        
        /* Optimisation pour les appareils à faible performance */
        @media (prefers-reduced-motion: reduce) {
          .circuit-line,
          .circuit-dot,
          .loading-dots::after {
            animation: none;
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
