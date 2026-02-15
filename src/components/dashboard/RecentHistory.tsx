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
        <div className="space-y-4 animate-slide-in-up">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={16} className="text-primary-500" />
                    Rétrospective 3 mois
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.map((month, index) => (
                    <div
                        key={`${month.label}-${month.year}`}
                        className="group p-4 rounded-2xl glass-card border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight leading-none mb-1">
                                    {month.year}
                                </span>
                                <span className="text-sm font-black text-white capitalize">
                                    {month.label}
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400 group-hover:scale-110 transition-transform">
                                <TrendingUp size={16} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-500 font-medium">Revenu réalisé</span>
                                <span className="text-xs font-black text-primary-300">
                                    {hidePrices ? '••• €' : `${month.earnings.toLocaleString()} €`}
                                </span>
                            </div>

                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500/50 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((month.earnings / 5000) * 100, 100)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-gray-500" />
                                    <span className="text-[10px] text-gray-400 font-bold">{month.hours}h</span>
                                </div>
                                <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase">{month.count} missions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentHistory;
