import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatusBadge: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:left-6 md:translate-x-0 z-50 animate-slide-up">
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/90 text-white rounded-full shadow-lg backdrop-blur-sm border border-red-400/50">
        <WifiOff size={16} />
        <span className="text-xs font-bold tracking-wide">Hors ligne</span>
      </div>
    </div>
  );
};
