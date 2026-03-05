import React from 'react';
import { TrendingUp, Clock, Target } from 'lucide-react';

interface MonthStat {
    label: string;
    year: string;
    earnings: number;
    hours: number;
    count: number;
}

interface RecentHistoryProps {
    data: MonthStat[];
    hidePrices?: boolean;
}

const RecentHistory: React.FC<RecentHistoryProps> = ({ data, hidePrices = false }) => {
    return (
        <div className="space-y-2.5 animate-slide-in-up">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em] flex items-center gap-1.5 px-0.5">
                <Target size={12} className="text-indigo-400" />
                Rétrospective 3 mois
            </h3>

            <div className="grid grid-cols-3 gap-2">
                {data.map((month, index) => (
                    <div
                        key={`${month.label}-${month.year}`}
                        className="group p-3 rounded-xl glass-card border-white/[0.04] hover:border-white/[0.08] transition-all"
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-tight leading-none mb-0.5">
                                    {month.year}
                                </span>
                                <span className="text-[11px] font-bold text-white capitalize truncate">
                                    {month.label}
                                </span>
                            </div>
                            <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                                <TrendingUp size={12} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-500 font-medium">Revenu</span>
                                <span className="text-[10px] font-bold text-indigo-300">
                                    {hidePrices ? '•••' : `${month.earnings.toLocaleString()}€`}
                                </span>
                            </div>

                            <div className="h-0.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500/40 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min((month.earnings / 5000) * 100, 100)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Clock size={9} className="text-gray-500" />
                                    <span className="text-[9px] text-gray-400 font-medium">{month.hours}h</span>
                                </div>
                                <span className="text-[8px] text-gray-500 font-medium">{month.count} missions</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentHistory;
