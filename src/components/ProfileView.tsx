import React, { useState } from 'react';
import { User as UserIcon, Euro, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../hooks/usePreferences';
import { toast } from 'sonner';

const ProfileView: React.FC = () => {
    const { user } = useAuth();
    const { dayRate, nightRate, setDayRate, setNightRate } = usePreferences();

    const [localDayRate, setLocalDayRate] = useState(dayRate);
    const [localNightRate, setLocalNightRate] = useState(nightRate);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        try {
            setDayRate(localDayRate);
            setNightRate(localNightRate);
            toast.success('Profil mis à jour avec succès');
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du profil');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <UserIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white leading-none">Mon Profil</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez vos informations et tarifs par défaut</p>
                </div>
            </div>

            {/* User Info Card */}
            <div className="glass-card p-6 rounded-3xl border border-white/[0.05] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <UserIcon size={120} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-500/20">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-xl font-bold text-white mb-1">
                            {user?.email?.split('@')[0]}
                        </h2>
                        <p className="text-gray-400 font-medium">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                Compte Actif
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rates Form Card */}
            <div className="glass-card p-6 rounded-3xl border border-white/[0.05]">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <Euro size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Tarifs par défaut</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                            Taux Horaire Jour (€/h)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={localDayRate}
                                onChange={(e) => setLocalDayRate(Number(e.target.value))}
                                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-2xl py-3 px-4 text-white font-medium transition-all outline-none"
                                placeholder="Ex: 25"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                €
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 ml-1">Appliqué automatiquement aux nouvelles missions de jour.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                            Taux Horaire Nuit (€/h)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={localNightRate}
                                onChange={(e) => setLocalNightRate(Number(e.target.value))}
                                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-2xl py-3 px-4 text-white font-medium transition-all outline-none"
                                placeholder="Ex: 30"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                €
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 ml-1">Appliqué automatiquement aux nouvelles missions de nuit.</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-2xl flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span>Enregistrer les tarifs</span>
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                <div className="text-blue-400 shrink-0">
                    <ArrowLeft size={20} className="rotate-180" />
                </div>
                <p className="text-xs text-blue-300/70 leading-relaxed">
                    Ces tarifs seront utilisés comme base de calcul lors de la création de nouvelles missions.
                    Vous pourrez toujours les modifier individuellement pour chaque mission spécifique.
                </p>
            </div>
        </div>
    );
};

export default ProfileView;
