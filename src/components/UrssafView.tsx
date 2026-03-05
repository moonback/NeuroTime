import React, { useMemo, useState } from 'react';
import { Mission } from '../types';
import { Calculator, Euro, TrendingUp, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface UrssafViewProps {
    missions: Mission[];
    hidePrices?: boolean;
}

const URSSAF_RATE = 0.231; // Taux standard prestations de services (BNC/BIC) 2024/2025 environ 23.1%

const UrssafView: React.FC<UrssafViewProps> = ({ missions, hidePrices = false }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        return format(new Date(), 'yyyy-MM');
    });

    const selectedMonthDate = useMemo(() => {
        return new Date(`${selectedMonth}-01`);
    }, [selectedMonth]);

    const now = new Date(); // still used for reference

    // Calcul du Chiffre d'Affaires Encaissé (missions terminées et payées)
    const earningsData = useMemo(() => {
        const paidMissions = missions.filter(m => m.status === 'completed' && m.isPaid);

        // Période sélectionnée
        let start: Date;
        let end: Date;

        if (selectedPeriod === 'month') {
            start = startOfMonth(selectedMonthDate);
            end = endOfMonth(selectedMonthDate);
        } else if (selectedPeriod === 'quarter') {
            const currentMonth = selectedMonthDate.getMonth();
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
            start = new Date(selectedMonthDate.getFullYear(), quarterStartMonth, 1);
            end = endOfMonth(new Date(selectedMonthDate.getFullYear(), quarterStartMonth + 2, 1));
        } else {
            start = new Date(selectedMonthDate.getFullYear(), 0, 1);
            end = new Date(selectedMonthDate.getFullYear(), 11, 31);
        }

        const currentRevenue = paidMissions
            .filter(m => {
                const date = new Date(m.startTime);
                return isWithinInterval(date, { start, end });
            })
            .reduce((acc, m) => acc + (m.totalEarnings || 0), 0);

        // Période précédente pour comparaison
        let prevStart: Date;
        let prevEnd: Date;

        if (selectedPeriod === 'month') {
            prevStart = startOfMonth(subMonths(start, 1));
            prevEnd = endOfMonth(subMonths(start, 1));
        } else if (selectedPeriod === 'quarter') {
            prevStart = subMonths(start, 3);
            prevEnd = subMonths(end, 3);
        } else {
            prevStart = new Date(start.getFullYear() - 1, 0, 1);
            prevEnd = new Date(start.getFullYear() - 1, 11, 31);
        }

        const prevRevenue = paidMissions
            .filter(m => {
                const date = new Date(m.startTime);
                return isWithinInterval(date, { start: prevStart, end: prevEnd });
            })
            .reduce((acc, m) => acc + (m.totalEarnings || 0), 0);

        const cotisations = currentRevenue * URSSAF_RATE;
        const netRevenue = currentRevenue - cotisations;

        return {
            currentRevenue,
            prevRevenue,
            cotisations,
            netRevenue,
            periodLabel: selectedPeriod === 'month' ? format(selectedMonthDate, 'MMMM yyyy', { locale: fr }) :
                selectedPeriod === 'quarter' ? `Trimestre ${Math.floor(selectedMonthDate.getMonth() / 3) + 1} ${selectedMonthDate.getFullYear()}` : `Année ${selectedMonthDate.getFullYear()}`
        };
    }, [missions, selectedPeriod, selectedMonthDate]);

    const formatPrice = (val: number) => {
        if (hidePrices) return '*** €';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-50 tracking-tight mb-2">Simulateur URSSAF</h1>
                    <p className="text-gray-300 text-sm md:text-base font-medium">Estimez vos cotisations sociales sur vos revenus encaissés</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Month Selector */}
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-100/50 border border-white/5 group transition-all hover:border-primary-500/30 backdrop-blur-md">
                        <Calculator className="w-4 h-4 text-primary-400" strokeWidth={2.5} />
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">
                                Période de calcul
                            </span>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent border-none text-xs font-black text-white focus:outline-none cursor-pointer leading-none"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    <div className="flex bg-dark-100/50 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                        <button
                            onClick={() => setSelectedPeriod('month')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedPeriod === 'month' ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            MOIS
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('quarter')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedPeriod === 'quarter' ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            TRIM.
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('year')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedPeriod === 'year' ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            ANNÉE
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chiffre d'Affaires Card */}
                <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Euro size={80} />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">CA Encaissé</span>
                        <span className="text-3xl font-black text-white">{formatPrice(earningsData.currentRevenue)}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">{earningsData.periodLabel}</span>
                            {earningsData.currentRevenue > earningsData.prevRevenue && earningsData.prevRevenue > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                    <TrendingUp size={10} />
                                    +{Math.round(((earningsData.currentRevenue - earningsData.prevRevenue) / earningsData.prevRevenue) * 100)}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cotisations Card */}
                <div className="glass-card rounded-2xl p-6 border-l-4 border-l-orange-500/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calculator size={80} />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Charges URSSAF ({Math.round(URSSAF_RATE * 1000) / 10}%)</span>
                        <span className="text-3xl font-black text-white">{formatPrice(earningsData.cotisations)}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400 italic">Montant à provisionner</span>
                        </div>
                    </div>
                </div>

                {/* Revenu Net Card */}
                <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary-500/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 size={80} />
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Revenu Net Estimé</span>
                        <span className="text-3xl font-black text-white">{formatPrice(earningsData.netRevenue)}</span>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <Info size={12} className="text-primary-400" />
                            <span>Après prélèvements sociaux</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <Info size={20} className="text-primary-400" />
                        Détails du calcul
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-gray-400 font-medium">Base de calcul</span>
                            <span className="text-sm text-gray-200 font-bold">Chiffre d'affaires encaissé</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-gray-400 font-medium">Taux de cotisations</span>
                            <span className="text-sm text-emerald-400 font-bold">23,10% (Prestations BNC/BIC)</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-gray-400 font-medium">Formation professionnelle</span>
                            <span className="text-sm text-gray-200 font-bold">Inclus (env. 0.2%)</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-400 font-medium whitespace-nowrap">Taxe frais de chambre</span>
                            <span className="text-sm text-gray-200 font-bold text-right">Variable selon secteur (0-0.4%)</span>
                        </div>
                    </div>
                    <div className="bg-primary-500/10 p-4 rounded-xl border border-primary-500/20 text-xs text-primary-200 leading-relaxed font-medium">
                        Le taux de 23,1% est le taux standard pour les activités libérales ou de prestations de services. Si vous bénéficiez de l'ACRE, vos taux seront réduits de moitié la première année.
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xl border border-orange-500/10">
                    <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-400" />
                        Points d'attention
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                            <p>Cette estimation ne prend pas en compte l'<b>Impôt sur le Revenu</b> (Prélèvement libératoire ou barème classique).</p>
                        </li>
                        <li className="flex gap-3 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                            <p>Les <b>frais de fonctionnement</b> (matériel, essence, assurance) ne sont pas déductibles en auto-entreprise.</p>
                        </li>
                        <li className="flex gap-3 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                            <p>N'oubliez pas de déclarer votre CA sur le site officiel de l'<b>URSSAF</b> (AutoEntrepreneur.urssaf.fr).</p>
                        </li>
                        <li className="flex gap-3 text-sm text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                            <p>Le seuil de la franchise en base de TVA (non facturation de la TVA) est de <b>39 100 €</b> (prestation de services).</p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UrssafView;
