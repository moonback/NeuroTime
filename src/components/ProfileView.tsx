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
                <div className="p-2 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)]">
                    <UserIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-none">Mon Profil</h1>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">Gérez vos informations et tarifs par défaut</p>
                </div>
            </div>

            {/* User Info Card */}
            <div className="glass p-6 rounded-[var(--radius-xl)] border border-[var(--border-default)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <UserIcon size={120} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary)] to-[#7c3aed] flex items-center justify-center text-3xl font-bold text-[var(--text-primary)] shadow-lg shadow-[var(--primary-glow)]">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                            {user?.email?.split('@')[0]}
                        </h2>
                        <p className="text-[var(--text-secondary)] font-medium">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full bg-[var(--success-light)] text-[var(--success)] text-[10px] font-bold uppercase tracking-wider">
                                Compte Actif
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rates Form Card */}
            <div className="glass p-6 rounded-[var(--radius-xl)] border border-[var(--border-default)]">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--warning-light)] text-[var(--warning)] flex items-center justify-center">
                        <Euro size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Tarifs par défaut</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1">
                            Taux Horaire Jour (€/h)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={localDayRate}
                                onChange={(e) => setLocalDayRate(Number(e.target.value))}
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] focus:border-[var(--primary)] rounded-[var(--radius-lg)] py-3 px-4 text-[var(--text-primary)] font-medium transition-all outline-none"
                                placeholder="Ex: 25"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
                                €
                            </div>
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)] ml-1">Appliqué automatiquement aux nouvelles missions de jour.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1">
                            Taux Horaire Nuit (€/h)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={localNightRate}
                                onChange={(e) => setLocalNightRate(Number(e.target.value))}
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] focus:border-[var(--primary)] rounded-[var(--radius-lg)] py-3 px-4 text-[var(--text-primary)] font-medium transition-all outline-none"
                                placeholder="Ex: 30"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
                                €
                            </div>
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)] ml-1">Appliqué automatiquement aux nouvelles missions de nuit.</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[var(--primary)] to-[#7c3aed] hover:shadow-lg hover:shadow-[var(--primary-glow)] disabled:opacity-50 text-white font-bold py-3 px-8 rounded-[var(--radius-lg)] flex items-center gap-2 transition-all duration-[var(--dur-fast)] active:scale-[0.98]"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-white" aria-hidden="true" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span>Enregistrer les tarifs</span>
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--primary-light)] border border-[var(--primary)] flex gap-3">
                <div className="text-[var(--primary)] shrink-0">
                    <ArrowLeft size={20} className="rotate-180" />
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Ces tarifs seront utilisés comme base de calcul lors de la création de nouvelles missions.
                    Vous pourrez toujours les modifier individuellement pour chaque mission spécifique.
                </p>
            </div>
        </div>
    );
};

export default ProfileView;
