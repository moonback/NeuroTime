import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  textColor: string;
  accentColor?: string;
  animationDelay?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = memo(({ icon, label, value, subtext, color, textColor, accentColor = 'border-[var(--primary)]', animationDelay = '0ms', trend, onClick }) => {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement, { strokeWidth: 2 })
    : icon;

  return (
    <div
      onClick={onClick}
      style={{ animationDelay }}
      className={[
        'group relative overflow-hidden rounded-[var(--radius-lg)] p-3 md:p-4',
        'glass border-t-2 animate-fade-up',
        'hover:border-[var(--primary)] hover:shadow-md hover:shadow-[var(--primary-glow)] transition-all duration-[var(--dur-fast)]',
        onClick ? 'cursor-pointer active:scale-[0.98] md:hover:scale-[1.01]' : '',
        color,
        accentColor,
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--dur-normal)]" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-3">
          <div
            className={[
              'shrink-0 p-2 md:p-2.5 rounded-[var(--radius-md)]',
              'bg-white/[0.04] border border-[var(--border-default)]',
              'group-hover:scale-110 transition-transform duration-[var(--dur-fast)]',
              textColor,
            ].join(' ')}
          >
            {renderedIcon}
          </div>

          {trend && (
            <div
              className={[
                'flex items-center gap-1',
                'text-[9px] font-semibold px-2 py-1 rounded-[var(--radius-sm)] border',
                'transition-all duration-[var(--dur-fast)]',
                trend.isPositive
                  ? 'text-[var(--success)] bg-[var(--success-light)] border-[var(--success)]'
                  : 'text-[var(--danger)] bg-[var(--danger-light)] border-[var(--danger)]',
              ].join(' ')}
            >
              {trend.isPositive ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
              <span className="num-financial">{trend.value}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[9px] uppercase font-semibold tracking-[0.1em] text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-secondary)]">
            {label}
          </p>
          <p className={`gradient-text num-financial text-lg md:text-2xl font-extrabold tracking-tight truncate leading-tight transition-all group-hover:scale-105 origin-left`}>
            {value}
          </p>
          {subtext && (
            <p className="text-[9px] md:text-[10px] text-[var(--text-tertiary)] truncate mt-1 font-medium transition-colors group-hover:text-[var(--text-secondary)]">
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
