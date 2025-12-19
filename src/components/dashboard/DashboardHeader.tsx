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
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 shadow-lg">
              <Briefcase className="w-6 h-6 text-primary-300" strokeWidth={2.5} />
            </div> */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-50 tracking-tight">Tableau de bord</h1>
              <p className="text-gray-400 text-sm md:text-base font-medium mt-0.5">Vue d'ensemble de votre activité</p>
            </div>
          </div>
        </div>
        
        {/* Bouton Export Modal */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-md hover:shadow-xl hover:scale-105"
            title="Options d'export"
          >
            <Share2 size={18} strokeWidth={2.5} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Contrôles et informations */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-primary-500/20 bg-gradient-to-r from-primary-500/5 via-primary-500/3 to-transparent">
        <div className="flex flex-wrap items-center gap-3">
          
          
          {/* Sélecteur de période amélioré */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-light border border-primary-500/20 bg-primary-500/5">
            <Calendar className="w-4 h-4 text-primary-300" strokeWidth={2.5} />
            <div className="flex flex-col">
              <label htmlFor="month-selector" className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Période
              </label>
              <input
                id="month-selector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-100 focus:outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>
        
        {/* Affichage du mois sélectionné formaté */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light border border-primary-500/20">
          <span className="text-xs text-gray-400 font-medium">Affichage :</span>
          <span className="text-sm font-bold text-primary-200">
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
                onClick={() => { onDownloadCSV(); setIsExportModalOpen(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl glass-light border border-primary-500/10 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all group text-left"
              >
                <div className="p-3 rounded-lg bg-green-500/20 text-green-300 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-100 group-hover:text-primary-300 transition-colors">Format CSV / Excel</h4>
                  <p className="text-xs text-gray-400">Pour une analyse détaillée dans un tableur</p>
                </div>
              </button>

              <button 
                onClick={() => { onDownloadMD(); setIsExportModalOpen(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl glass-light border border-primary-500/10 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all group text-left"
              >
                <div className="p-3 rounded-lg bg-blue-500/20 text-blue-300 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-100 group-hover:text-primary-300 transition-colors">Rapport Markdown</h4>
                  <p className="text-xs text-gray-400">Document texte formaté pour documentation</p>
                </div>
              </button>

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

