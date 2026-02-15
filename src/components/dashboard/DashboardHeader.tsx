import React, { useState } from 'react';
import { Briefcase, Download, Calendar, FileText, File, X, Share2, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface DashboardHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedMonthDate: Date;
  onDownloadCSV: () => void;
  onDownloadMD: () => void;
  onDownloadPDF: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedMonth,
  setSelectedMonth,
  selectedMonthDate,
  onDownloadCSV,
  onDownloadMD,
  onDownloadPDF
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <header className="space-y-6 animate-slide-in-up">
      {/* Top Bar: Title & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-medium flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Suivi de votre activité en temps réel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="group relative flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs border border-white/10 hover:border-white/20 whitespace-nowrap"
          >
            <Share2 size={16} strokeWidth={2.5} className="text-primary-400 group-hover:rotate-12 transition-transform" />
            <span>Exporter le rapport</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Context */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-1.5 px-1.5 sm:pr-4 rounded-2xl glass-card border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-dark-300/50 border border-white/5 group transition-all hover:border-primary-500/30">
            <Calendar className="w-4 h-4 text-primary-400" strokeWidth={2.5} />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">
                Période
              </span>
              <input
                id="month-selector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-black text-white focus:outline-none cursor-pointer leading-none"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none mb-1">Affichage actuel</span>
            <span className="text-xs font-black text-primary-400 uppercase tracking-wide">
              {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* Modal d'export */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsExportModalOpen(false)}>
          <div className="w-full max-w-md bg-dark-200 glass-card rounded-2xl shadow-2xl border border-primary-500/30 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary-500/20 text-primary-300">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Exporter le rapport</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => { onDownloadPDF(); setIsExportModalOpen(false); }}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all group text-left"
              >
                <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
                  <File size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-200 group-hover:text-primary-300 transition-colors">Document PDF</h4>
                  <p className="text-[11px] text-gray-500">Rapport complet optimisé pour l'impression</p>
                </div>
              </button>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/5 text-center">
              <p className="text-[10px] text-gray-500">Les exports concernent les données du mois affiché</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;

