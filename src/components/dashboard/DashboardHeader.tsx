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
    <header className="space-y-3 animate-slide-in-up">
      {/* Top Bar: Title & Primary Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-gray-500 text-[9px] font-semibold uppercase tracking-[0.12em] flex items-center gap-1.5 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            Live Monitor
          </p>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="group flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-white px-3 py-1.5 rounded-lg font-semibold transition-all text-[10px] uppercase tracking-wider border border-white/[0.06] hover:border-white/[0.12] whitespace-nowrap"
        >
          <Share2 size={12} strokeWidth={2.5} className="text-indigo-400" />
          <span>Exporter</span>
        </button>
      </div>

      {/* Control Bar: Month selector */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl glass-card border-white/[0.04]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" strokeWidth={2} />
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider leading-none mb-0.5">
              Période
            </span>
            <input
              id="month-selector"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-white focus:outline-none cursor-pointer leading-none p-0"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="flex items-center px-2.5 py-1.5 rounded-lg bg-white/[0.02]">
          <span className="text-[10px] font-bold text-indigo-400 capitalize">
            {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Modal d'export */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setIsExportModalOpen(false)}>
          <div className="w-full max-w-sm glass-card rounded-2xl shadow-2xl border border-indigo-500/20 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/[0.06] bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300">
                  <Download size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Exporter le rapport</h3>
                  <p className="text-[9px] text-gray-500 capitalize">{format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-3.5">
              <button
                onClick={() => { onDownloadPDF(); setIsExportModalOpen(false); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all group text-left"
              >
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
                  <File size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-indigo-300 transition-colors">Document PDF</h4>
                  <p className="text-[10px] text-gray-500">Rapport optimisé pour l'impression</p>
                </div>
              </button>
            </div>

            <div className="px-3.5 pb-3 text-center">
              <p className="text-[9px] text-gray-600">Les exports concernent le mois affiché</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
