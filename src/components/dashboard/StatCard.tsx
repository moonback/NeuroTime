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

const StatCard: React.FC<StatCardProps> = memo(({ icon, label, value, subtext, textColor, trend, onClick }) => {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement, { strokeWidth: 2 })
    : icon;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={[
        'group relative min-h-[132px] overflow-hidden rounded-xl p-4 md:p-5',
        'glass-card border border-[var(--border-subtle)]',
        'transition-all duration-200',
        onClick ? 'cursor-pointer active:scale-[0.99]' : '',
      ].join(' ')}
    >
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`shrink-0 rounded-lg border border-[var(--border-subtle)] bg-white/[0.035] p-2.5 ${textColor}`}>
            {renderedIcon}
          </div>

          {trend && (
            <div
              className={[
                'flex items-center gap-1 rounded-full border px-2 py-1',
                'text-[10px] font-semibold tabular-nums',
                trend.isPositive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/20 bg-red-500/10 text-red-400',
              ].join(' ')}
            >
              {trend.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {label}
          </p>
          <p className={`num-financial truncate text-2xl font-semibold leading-none tracking-[-0.04em] md:text-3xl ${textColor}`}>
            {value}
          </p>
          {subtext && (
            <p className="truncate text-[11px] font-medium text-[var(--text-secondary)]">
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
