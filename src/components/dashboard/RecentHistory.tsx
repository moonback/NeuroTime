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
        <section className="space-y-3 animate-slide-in-up">
            <h3 className="flex items-center gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <Target size={13} className="text-[var(--accent)]" />
                Rétrospective 3 mois
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {data.map((month, index) => (
                    <div
                        key={`${month.label}-${month.year}`}
                        className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 transition-all hover:border-[var(--border-default)]"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-col">
                                <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                    {month.year}
                                </span>
                                <span className="truncate text-sm font-semibold capitalize text-[var(--text-primary)]">
                                    {month.label}
                                </span>
                            </div>
                            <div className="rounded-lg border border-[var(--border-subtle)] bg-white/[0.035] p-2 text-[var(--accent)]">
                                <TrendingUp size={14} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-medium text-[var(--text-muted)]">Revenu</span>
                                <span className="num-financial text-sm font-semibold text-[var(--accent)]">
                                    {hidePrices ? '•••' : `${month.earnings.toLocaleString()}€`}
                                </span>
                            </div>

                            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                                <div
                                    className="h-full rounded-full bg-[var(--accent)]/70 transition-[width] duration-200 ease-out"
                                    style={{ width: `${Math.min((month.earnings / 5000) * 100, 100)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={11} className="text-[var(--text-muted)]" />
                                    <span className="text-xs font-medium text-[var(--text-secondary)]">{month.hours}h</span>
                                </div>
                                <span className="text-[11px] font-medium text-[var(--text-muted)]">{month.count} missions</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RecentHistory;
