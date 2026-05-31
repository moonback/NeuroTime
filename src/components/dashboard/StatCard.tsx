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
        'group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-xl p-4 md:p-5',
        'glass-card border',
        'transition-all duration-200 animate-slide-in-up',
        onClick ? 'cursor-pointer active:scale-[0.99]' : '',
        color,
      ].join(' ')}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={[
          'shrink-0 rounded-xl border border-[var(--border-subtle)] bg-white/[0.035] p-2.5',
          textColor,
        ].join(' ')}>
          {renderedIcon}
        </div>

        {trend && (
          <div className={[
            'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold',
            trend.isPositive
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/20 bg-red-500/10 text-red-300',
          ].join(' ')}>
            {trend.isPositive ? <TrendingUp size={12} strokeWidth={2.25} /> : <TrendingDown size={12} strokeWidth={2.25} />}
            <span className="num-financial">{trend.value}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">
          {label}
        </p>
        <p className={`num-financial truncate text-2xl font-bold leading-none tracking-tight md:text-3xl ${textColor}`}>
          {value}
        </p>
        {subtext && (
          <p className="truncate text-[12px] font-medium text-[var(--text-secondary)]">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
