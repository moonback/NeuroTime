import React, { useState } from 'react';
import { Download, Calendar, File, X, Share2 } from 'lucide-react';
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
    <header className="space-y-3 md:space-y-4 animate-slide-in-up">
      {/* Top Bar: Title & Primary Actions — ENHANCED FOR DESKTOP */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
        <div className="flex flex-col min-w-0">
          <h1 className="font-display text-lg md:text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-gray-500 text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            Live Monitor
          </p>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="group flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-white px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold transition-all text-[10px] md:text-[11px] uppercase tracking-wider border border-white/[0.06] hover:border-white/[0.12] whitespace-nowrap hover:scale-105 active:scale-95"
        >
          <Share2 size={14} strokeWidth={2.5} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span>Exporter</span>
        </button>
      </div>

      {/* Control Bar: Month selector — ENHANCED */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 md:p-3 rounded-xl glass-card border-white/[0.04] hover:border-white/[0.08] transition-all">
        <div className="flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-all">
          <Calendar className="w-4 h-4 text-indigo-400" strokeWidth={2} />
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider leading-none mb-1">
              Période
            </span>
            <input
              id="month-selector"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-[11px] md:text-[12px] font-bold text-white focus:outline-none cursor-pointer leading-none p-0 hover:text-indigo-300 transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-2 md:py-2.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <span className="text-[11px] md:text-[13px] font-bold text-indigo-300 capitalize">
            {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Modal d'export — ENHANCED */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setIsExportModalOpen(false)}>
          <div className="w-full max-w-md glass-card rounded-2xl shadow-2xl border border-indigo-500/20 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/[0.06] bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-white">Exporter le rapport</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent border-none text-[10px] md:text-[11px] font-bold text-indigo-400 focus:outline-none cursor-pointer p-0 capitalize hover:text-indigo-300 transition-colors"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-2 text-gray-500 hover:text-white transition-all rounded-lg hover:bg-white/[0.05] hover:scale-110 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-4 md:p-5 space-y-3">
              <button
                onClick={() => { onDownloadPDF(); setIsExportModalOpen(false); }}
                className="w-full flex items-center gap-4 p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-red-500/30 hover:bg-red-500/5 transition-all group text-left hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-110 group-hover:bg-red-500/20 transition-all border border-red-500/20">
                  <File size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-200 group-hover:text-red-300 transition-colors">Document PDF</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Rapport optimisé pour l'impression</p>
                </div>
              </button>
            </div>

            <div className="px-4 md:px-5 pb-4 md:pb-5 text-center">
              <p className="text-[9px] md:text-[10px] text-gray-600">Les exports concernent le mois affiché</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
