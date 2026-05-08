import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  textColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = memo(({ icon, label, value, subtext, color, textColor, trend, onClick }) => {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement, { strokeWidth: 2 })
    : icon;

  return (
    <div
      onClick={onClick}
      className={[
        'group relative overflow-hidden rounded-xl p-3 md:p-4',
        'glass-card border border-white/[0.04]',
        'transition-all duration-200 animate-slide-in-up',
        onClick ? 'cursor-pointer active:scale-[0.98] md:hover:scale-[1.02]' : '',
        color,
      ].join(' ')}
    >
      {/* Enhanced hover gradient for desktop */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Subtle glow effect on hover (desktop only) */}
      <div className="hidden md:block absolute -inset-[1px] bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top row: icon + trend */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={[
              'shrink-0 p-2 md:p-2.5 rounded-lg md:rounded-xl',
              'bg-white/[0.04] border border-white/[0.06]',
              'group-hover:scale-110 transition-transform duration-200',
              textColor,
            ].join(' ')}
          >
            {renderedIcon}
          </div>

          {trend && (
            <div
              className={[
                'flex items-center gap-1',
                'text-[9px] font-semibold px-2 py-1 rounded-md border',
                'transition-all duration-200',
                trend.isPositive
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15 group-hover:bg-emerald-500/15'
                  : 'text-red-400 bg-red-500/10 border-red-500/15 group-hover:bg-red-500/15',
              ].join(' ')}
            >
              {trend.isPositive ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
              <span className="num-financial">{trend.value}%</span>
            </div>
          )}
        </div>

        {/* Value & label */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase font-semibold tracking-[0.1em] text-gray-500 transition-colors group-hover:text-gray-400">
            {label}
          </p>
          <p className={`num-financial text-lg md:text-2xl font-extrabold tracking-tight ${textColor} truncate leading-tight transition-all group-hover:scale-105 origin-left`}>
            {value}
          </p>
          {subtext && (
            <p className="text-[9px] md:text-[10px] text-gray-500 truncate mt-1 font-medium transition-colors group-hover:text-gray-400">
              {subtext}
            </p>
          )}
        </div>
      </div>

      {/* Bottom accent line (desktop only) */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ color: textColor.replace('text-', '') }} />
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
