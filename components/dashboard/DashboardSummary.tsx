import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Sparkles } from 'lucide-react';
import { Mission } from '../../types';
import { generateSummary } from '../../services/geminiService';

interface DashboardSummaryProps {
  missions: Mission[];
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ missions }) => {
  const [summary, setSummary] = useState<string>('Analyse de vos activités en cours...');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const refreshSummary = useCallback(async () => {
    if (missions.length === 0) {
      setSummary("Aucune mission enregistrée. Commencez par noter vos heures !");
      return;
    }

    setIsSummaryLoading(true);
    setSummary('Analyse de vos activités en cours...');
    try {
      const generatedSummary = await generateSummary(missions);
      setSummary(generatedSummary);
    } catch (error) {
      console.warn('Erreur lors du rafraîchissement du résumé IA', error);
      setSummary("Impossible de rafraîchir le résumé pour le moment.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [missions]);

  // Initialiser le message par défaut
  useEffect(() => {
    if (missions.length === 0) {
      setSummary("Aucune mission enregistrée. Commencez par noter vos heures !");
    } else {
      setSummary("Cliquez sur 'Rafraîchir' pour obtenir une analyse de vos données.");
    }
  }, [missions.length]);

  return (
    <div className="glass-card bg-primary-500/10 rounded-2xl p-6 md:p-8 text-gray-100 relative overflow-hidden animate-slide-in-up mb-6 border-primary-500/20">
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary-500/20 p-2 rounded-xl border border-primary-500/30 shadow-md">
               <Sparkles className="w-5 h-5 text-primary-400" />
            </span>
            <h3 className="font-bold text-lg md:text-xl tracking-wide text-primary-400">Assistant Intelligent</h3>
          </div>
          <button
            type="button"
            onClick={refreshSummary}
            disabled={isSummaryLoading || missions.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass-button text-xs md:text-sm font-semibold text-primary-300 border border-primary-500/30 hover:border-primary-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Rafraîchir l'analyse IA"
          >
            <RefreshCcw className={`w-4 h-4 ${isSummaryLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSummaryLoading ? 'Analyse...' : 'Rafraîchir'}</span>
          </button>
        </div>
        <p className="text-gray-100 leading-relaxed text-sm md:text-base font-medium max-w-2xl">{summary}</p>
      </div>
    </div>
  );
};

export default DashboardSummary;

