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
        'group relative overflow-hidden rounded-xl p-3 md:p-3.5',
        'glass-card border border-white/[0.04]',
        'transition-all duration-200 animate-slide-in-up',
        onClick ? 'cursor-pointer active:scale-[0.98]' : '',
        color,
      ].join(' ')}
    >
      {/* Subtle hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top row: icon + trend */}
        <div className="flex items-start justify-between mb-2.5">
          <div
            className={[
              'shrink-0 p-2 rounded-lg',
              'bg-white/[0.04] border border-white/[0.06]',
              textColor,
            ].join(' ')}
          >
            {renderedIcon}
          </div>

          {trend && (
            <div
              className={[
                'flex items-center gap-1',
                'text-[9px] font-semibold px-1.5 py-0.5 rounded-md border',
                trend.isPositive
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15'
                  : 'text-red-400 bg-red-500/10 border-red-500/15',
              ].join(' ')}
            >
              {trend.isPositive ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
              <span className="num-financial">{trend.value}%</span>
            </div>
          )}
        </div>

        {/* Value & label */}
        <div className="space-y-0.5">
          <p className="text-[9px] uppercase font-semibold tracking-[0.1em] text-gray-500">
            {label}
          </p>
          <p className={`num-financial text-lg md:text-xl font-extrabold tracking-tight ${textColor} truncate leading-tight`}>
            {value}
          </p>
          {subtext && (
            <p className="text-[9px] text-gray-500 truncate mt-0.5 font-medium">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
