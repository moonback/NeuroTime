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
  <div className={`p-5 md:p-6 rounded-2xl glass-card transition-all hover:shadow-lg ${color} group relative animate-slide-in-up shadow-md`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-dark-50/80 shadow-lg border border-dark-100/50 ${textColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${trend.isPositive ? 'text-green-300 bg-green-500/20 border border-green-500/30' : 'text-red-300 bg-red-500/20 border border-red-500/30'}`}>
            {trend.isPositive ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight group-hover:scale-105 transition-transform duration-300 mb-1">{value}</p>
        <p className={`text-xs md:text-sm font-bold mt-1 ${textColor} tracking-wide`}>{label}</p>
        <p className="text-[10px] md:text-xs text-gray-300 mt-2 font-medium">{subtext}</p>
      </div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

export default StatCard;

