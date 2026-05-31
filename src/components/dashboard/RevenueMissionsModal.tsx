import React from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Mission } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface RevenueMissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    missions: Mission[];
    selectedMonthDate: Date;
    onEdit: (mission: Mission) => void;
    hidePrices?: boolean;
}

const RevenueMissionsModal: React.FC<RevenueMissionsModalProps> = ({
    isOpen,
    onClose,
    missions,
    selectedMonthDate,
    onEdit,
    hidePrices = false
}) => {
    if (!isOpen) return null;

    const monthLabel = format(selectedMonthDate, 'MMMM yyyy', { locale: fr });
    const totalEarnings = missions.reduce((sum, m) => sum + (m.totalEarnings || 0), 0);

    const sortedMissions = [...missions].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const formatPrice = (value: number | null | undefined): string => {
        if (hidePrices) return '***';
        if (value === null || value === undefined) return '0';
        return value.toLocaleString('fr-FR');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6" onClick={onClose}>
            <div
                className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-elevated)] animate-scale-in"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="revenue-modal-title"
            >
                <div className="border-b border-[var(--border-subtle)] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
                                <TrendingUp size={20} strokeWidth={2.3} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Chiffre d'affaires</p>
                                <h3 id="revenue-modal-title" className="mt-1 font-display text-xl font-semibold tracking-[-0.045em] text-[var(--text-primary)] sm:text-2xl">
                                    Détail des missions
                                </h3>
                                <p className="mt-1 text-sm font-medium capitalize text-[var(--text-secondary)]">{monthLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn-ghost inline-flex h-10 min-h-0 w-10 shrink-0 items-center justify-center p-0"
                            aria-label="Fermer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-white/[0.025] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Total période</span>
                        <span className="num-financial text-3xl font-semibold tracking-[-0.05em] text-emerald-400">{formatPrice(totalEarnings)} €</span>
                    </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar sm:p-6">
                    {sortedMissions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-white/[0.02] py-14 text-center">
                            <AlertCircle size={34} className="mx-auto mb-3 text-[var(--text-muted)]" />
                            <p className="font-semibold text-[var(--text-secondary)]">Aucune mission comptabilisée</p>
                        </div>
                    ) : (
                        sortedMissions.map((mission, index) => (
                            <button
                                key={mission.id}
                                onClick={() => { onEdit(mission); onClose(); }}
                                className="group flex w-full flex-col gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-left transition-all hover:border-[var(--border-default)] hover:bg-white/[0.045] sm:flex-row sm:items-center"
                                style={{ animationDelay: `${index * 35}ms` }}
                            >
                                <div className="flex min-w-[64px] items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2 sm:flex-col sm:gap-0">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{format(new Date(mission.startTime), 'MMM', { locale: fr })}</span>
                                    <span className="text-xl font-semibold leading-none text-[var(--text-primary)] sm:mt-1">{format(new Date(mission.startTime), 'dd')}</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                        <h4 className="truncate text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-hover)]">{mission.title}</h4>
                                        <span className={`num-financial shrink-0 text-sm font-semibold ${mission.status === 'planned' ? 'text-[var(--accent)]' : 'text-emerald-400'}`}>
                                            {formatPrice(mission.totalEarnings)} €
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-[var(--text-secondary)]">
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-[var(--text-muted)]" />
                                            {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                                        </span>
                                        <span className="flex min-w-0 items-center gap-1.5">
                                            <MapPin size={12} className="shrink-0 text-[var(--text-muted)]" />
                                            <span className="truncate max-w-[140px]">{mission.location}</span>
                                        </span>
                                        {mission.status === 'planned' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-white/[0.035] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
                                                <Calendar size={10} />
                                                Planifié
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-white/[0.035] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${mission.isPaid ? 'text-emerald-400' : 'text-[var(--warning)]'}`}>
                                                {mission.isPaid ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                {mission.isPaid ? 'Payé' : 'En attente'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="border-t border-[var(--border-subtle)] px-5 py-4 text-center">
                    <p className="text-[11px] font-medium text-[var(--text-muted)]">
                        Cliquez sur une mission pour la consulter ou la modifier.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RevenueMissionsModal;
