import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  minDisplayTime?: number;
  ready?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, minDisplayTime = 1500, ready = true }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const checkFinish = () => {
      if (!ready) return;
      
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onFinish();
        }, 300);
      }, remaining);
    };

    if (document.readyState === 'complete' && ready) {
      checkFinish();
    } else if (ready) {
      if (document.readyState === 'complete') {
        checkFinish();
      } else {
        window.addEventListener('load', checkFinish);
        return () => window.removeEventListener('load', checkFinish);
      }
    }
  }, [onFinish, minDisplayTime, startTime, ready]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex items-center justify-center overflow-hidden"
      style={{
        animation: isVisible ? 'fadeIn 0.3s ease-in' : 'fadeOut 0.3s ease-out forwards'
      }}
    >
      {/* Circuit Board / Neural Network Background */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.4, filter: 'blur(0.5px)' }}
        preserveAspectRatio="xMidYMid slice"
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
        {[...Array(16)].map((_, i) => {
          const angle = (i * 22.5) * Math.PI / 180;
          const length = 35;
          const x1 = '50%';
          const y1 = '50%';
          const x2 = 50 + Math.cos(angle) * length + '%';
          const y2 = 50 + Math.sin(angle) * length + '%';
          
          return (
            <g key={i} filter="url(#glow)">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="url(#circuitGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                className="circuit-line"
                opacity="0.7"
              />
              {/* Dots along the line */}
              {[...Array(6)].map((_, j) => {
                const progress = (j + 1) / 6;
                const dotX = 50 + Math.cos(angle) * length * progress;
                const dotY = 50 + Math.sin(angle) * length * progress;
                return (
                  <circle
                    key={j}
                    cx={`${dotX}%`}
                    cy={`${dotY}%`}
                    r="2.5"
                    fill="#008CFF"
                    opacity="0.7"
                    className="circuit-dot"
                  />
                );
              })}
            </g>
          );
        })}
        
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
      <div className="relative z-10 flex flex-row items-center justify-center gap-6 md:gap-10 px-6 md:px-8 max-w-4xl">
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
              className="h-28 w-28 md:h-36 md:w-36 object-contain"
              style={{
                filter: 'drop-shadow(0 0 25px rgba(0,140,255,0.9)) drop-shadow(0 0 50px rgba(0,140,255,0.5))',
                animation: 'float 3s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        {/* Text Content - Right side */}
        <div className="flex flex-col justify-center">
          {/* App Name */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-none">
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
          <p className="text-white/70 text-xs md:text-sm lg:text-base font-medium mt-2 md:mt-3 leading-relaxed">
            Gérez votre temps, maximisez vos gains.
          </p>
        </div>
      </div>

      {/* Loading Indicator - Bottom */}
      <div className="absolute bottom-8 md:bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-white/60 text-sm md:text-base font-medium">
          Chargement en cours
          <span className="loading-dots">...</span>
        </p>
        <div className="flex gap-2 mt-1">
          <div 
            className="w-2.5 h-2.5 bg-[#008CFF] rounded-full"
            style={{
              animation: 'dotPulse 1.4s ease-in-out infinite',
              animationDelay: '0s',
              boxShadow: '0 0 10px rgba(0,140,255,0.9), 0 0 20px rgba(0,140,255,0.5)'
            }}
          />
          <div 
            className="w-2.5 h-2.5 bg-[#008CFF] rounded-full"
            style={{
              animation: 'dotPulse 1.4s ease-in-out infinite',
              animationDelay: '0.2s',
              boxShadow: '0 0 10px rgba(0,140,255,0.9), 0 0 20px rgba(0,140,255,0.5)'
            }}
          />
          <div 
            className="w-2.5 h-2.5 bg-[#008CFF] rounded-full"
            style={{
              animation: 'dotPulse 1.4s ease-in-out infinite',
              animationDelay: '0.4s',
              boxShadow: '0 0 10px rgba(0,140,255,0.9), 0 0 20px rgba(0,140,255,0.5)'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
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
        }
        
        .circuit-dot {
          animation: pulseGlow 2s ease-in-out infinite;
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
      `}</style>
    </div>
  );
};

export default SplashScreen;
