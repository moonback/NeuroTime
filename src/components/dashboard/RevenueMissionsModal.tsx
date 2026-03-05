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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div
                className="w-full max-w-2xl max-h-[85vh] bg-dark-200 glass-strong rounded-3xl border border-emerald-500/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] flex flex-col overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Détail du Chiffre d'Affaires</h3>
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">{monthLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-dark-300/50 border border-white/5">
                        <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">Total Période</span>
                        <span className="text-2xl font-black text-emerald-400">{formatPrice(totalEarnings)} €</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                    {sortedMissions.length === 0 ? (
                        <div className="py-12 text-center">
                            <AlertCircle size={40} className="mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-400 font-bold">Aucune mission comptabilisée</p>
                        </div>
                    ) : (
                        sortedMissions.map((mission, index) => (
                            <div
                                key={mission.id}
                                onClick={() => { onEdit(mission); onClose(); }}
                                className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl glass-light border transition-all cursor-pointer animate-slide-in-up ${mission.status === 'planned' ? 'border-primary-500/10 hover:border-primary-500/30' : 'border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5'}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Date */}
                                <div className={`flex sm:flex-col items-center justify-center p-2 rounded-xl bg-dark-300 min-w-[60px] border border-white/5 transition-all ${mission.status === 'planned' ? 'group-hover:bg-primary-500/20 group-hover:border-primary-500/40' : 'group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40'}`}>
                                    <span className="text-[10px] text-gray-500 group-hover:text-emerald-300 font-black uppercase leading-none">{format(new Date(mission.startTime), 'MMM', { locale: fr })}</span>
                                    <span className="text-lg font-black text-white group-hover:text-emerald-200 leading-none mt-1">{format(new Date(mission.startTime), 'dd')}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className={`font-bold text-gray-100 truncate transition-colors uppercase text-sm tracking-wide ${mission.status === 'planned' ? 'group-hover:text-primary-300' : 'group-hover:text-emerald-300'}`}>{mission.title}</h4>
                                        <span className={`text-sm font-black shrink-0 ${mission.status === 'planned' ? 'text-primary-400' : 'text-emerald-400'}`}>
                                            {formatPrice(mission.totalEarnings)} €
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} className="text-gray-600" />
                                            {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} className="text-gray-600" />
                                            <span className="truncate max-w-[120px]">{mission.location}</span>
                                        </span>
                                        {mission.status === 'planned' ? (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400">
                                                <Calendar size={10} />
                                                PLANIFIÉ
                                            </span>
                                        ) : (
                                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 ${mission.isPaid ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                {mission.isPaid ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                {mission.isPaid ? 'PAYÉ' : 'EN ATTENTE'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/5 text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                        Cliquez sur une mission pour la consulter ou la modifier
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RevenueMissionsModal;
