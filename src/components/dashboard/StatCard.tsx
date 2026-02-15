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
}

const StatCard: React.FC<StatCardProps> = memo(({ icon, label, value, subtext, color, textColor, trend }) => {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement, { strokeWidth: 2.5 })
    : icon;

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-3xl p-5 glass-card',
        'transition-all duration-500 animate-slide-in-up',
        'hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40',
        'border border-white/5',
        color,
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-4">
          <div
            className={[
              'shrink-0 p-3 rounded-2xl',
              'bg-white/5 border border-white/10 shadow-inner',
              'transition-all duration-500 group-hover:scale-110 group-hover:rotate-3',
              textColor,
            ].join(' ')}
          >
            {renderedIcon}
          </div>

          {trend && (
            <div
              className={[
                'flex items-center gap-1.5',
                'text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-md',
                trend.isPositive
                  ? 'text-green-300 bg-green-500/10 border-green-500/20'
                  : 'text-red-300 bg-red-500/10 border-red-500/20',
              ].join(' ')}
            >
              {trend.isPositive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
              <span className="tabular-nums">{trend.value}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 group-hover:text-gray-300 transition-colors">
            {label}
          </p>
          <div className="flex flex-col">
            <p className={`text-2xl sm:text-3xl font-black tracking-tighter transition-all duration-300 ${textColor} group-hover:scale-[1.02] origin-left truncate`}>
              {value}
            </p>
            {subtext && (
              <p className="text-[10px] text-gray-500 font-medium group-hover:text-gray-400 transition-colors truncate mt-1">
                {subtext}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
