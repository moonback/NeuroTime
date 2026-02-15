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
    <header className="space-y-4 animate-slide-in-up">
      {/* Titre et description */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter filter drop-shadow-sm">
            Tableau de bord
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vue d'ensemble de votre activité en temps réel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="group relative flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold transition-all text-sm border border-white/10 hover:border-white/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Share2 size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-3xl glass-card border-white/5 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-[#0f141f] border border-white/5 shadow-inner group transition-all hover:border-primary-500/30">
            <Calendar className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            <div className="flex flex-col">
              <label htmlFor="month-selector" className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                Période active
              </label>
              <input
                id="month-selector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-sm font-black text-white focus:outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 glow-primary" />
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Affichage actuel</span>
          <span className="text-sm font-black text-primary-300">
            {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Modal d'export */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsExportModalOpen(false)}>
          <div className="w-full max-w-md bg-dark-200 glass-card rounded-2xl shadow-2xl border border-primary-500/30 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-500/20 text-primary-300">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-100">Exporter les données {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}</h3>
                  <p className="text-xs text-gray-400">Choisir le format d'export</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-5 space-y-3">
              <button
                onClick={() => { onDownloadPDF(); setIsExportModalOpen(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl glass-light border border-primary-500/10 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all group text-left"
              >
                <div className="p-3 rounded-lg bg-red-500/20 text-red-300 group-hover:scale-110 transition-transform">
                  <File size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-100 group-hover:text-primary-300 transition-colors">Document PDF</h4>
                  <p className="text-xs text-gray-400">Rapport officiel pour facturation/archives</p>
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

