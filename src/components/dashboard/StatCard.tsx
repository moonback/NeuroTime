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
        'group relative overflow-hidden rounded-2xl p-3 sm:p-4 glass-card border border-opacity-60',
        'transition-all duration-300 animate-slide-in-up',
        'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
        'focus-within:ring-2 focus-within:ring-primary-500/40',
        color,
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/7 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5" />

      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={[
                'shrink-0 p-2.5 rounded-xl',
                'bg-dark-50/40 border border-white/10 shadow-sm',
                'transition-transform duration-300 group-hover:scale-[1.03]',
                textColor,
              ].join(' ')}
            >
              {renderedIcon}
            </div>

            <div className="min-w-0">
              <p className={`text-[11px] sm:text-xs uppercase font-extrabold tracking-wider opacity-80 ${textColor} truncate`}>
                {label}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-gray-50 tracking-tight leading-none truncate">
                {value}
              </p>
            </div>
          </div>

          {trend && (
            <div
              className={[
                'shrink-0 flex items-center gap-1.5',
                'text-[11px] font-extrabold px-2 py-1 rounded-lg border',
                trend.isPositive
                  ? 'text-green-200 bg-green-500/10 border-green-500/25'
                  : 'text-red-200 bg-red-500/10 border-red-500/25',
              ].join(' ')}
              aria-label={`Évolution ${trend.isPositive ? 'positive' : 'négative'} de ${trend.value}%`}
              title={`Évolution: ${trend.isPositive ? '+' : '-'}${trend.value}%`}
            >
              {trend.isPositive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
              <span className="tabular-nums">{trend.value}%</span>
            </div>
          )}
        </div>

        {subtext && (
          <p className="text-[11px] sm:text-xs text-gray-400 font-medium truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;

