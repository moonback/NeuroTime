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

const StatCard: React.FC<StatCardProps> = memo(({ icon, label, value, subtext, color, textColor, trend }) => (
  <div className={`p-3 md:p-4 rounded-xl glass-card transition-all hover:shadow-md ${color} group relative animate-slide-in-up border-opacity-50`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10 flex items-center justify-between gap-3">
      {/* Icon & Value Block */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-dark-50/50 shadow-sm border border-dark-100/30 ${textColor} group-hover:scale-105 transition-transform duration-300`}>
          {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
        </div>
        <div>
           <p className={`text-[10px] uppercase font-bold tracking-wider opacity-80 ${textColor}`}>{label}</p>
           <p className="text-xl md:text-2xl font-black text-gray-100 tracking-tight leading-none mt-0.5">{value}</p>
        </div>
      </div>

      {/* Trend or Subtext */}
      <div className="flex flex-col items-end text-right">
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${trend.isPositive ? 'text-green-300 bg-green-500/10 border border-green-500/20' : 'text-red-300 bg-red-500/10 border border-red-500/20'}`}>
            {trend.isPositive ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
            {trend.value}%
          </div>
        )}
        <p className="text-[9px] text-gray-400 mt-1 font-medium max-w-[80px] truncate">{subtext}</p>
      </div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

export default StatCard;

