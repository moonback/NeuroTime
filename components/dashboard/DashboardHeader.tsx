import React from 'react';
import { Briefcase, Download, Calendar, FileText, File } from 'lucide-react';
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
  return (
    <header className="space-y-4 animate-slide-in-up">
      {/* Titre et description */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 shadow-lg">
              <Briefcase className="w-6 h-6 text-primary-300" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-50 tracking-tight">Tableau de bord</h1>
              <p className="text-gray-400 text-sm md:text-base font-medium mt-0.5">Vue d'ensemble de votre activité</p>
            </div>
          </div>
        </div>
        
        {/* Boutons d'export groupés */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl glass-card border border-primary-500/20 bg-primary-500/5">
            <Download className="w-4 h-4 text-primary-300" strokeWidth={2} />
            <span className="text-xs font-semibold text-gray-300">Exports</span>
          </div>
          <button 
            onClick={onDownloadCSV}
            className="flex items-center justify-center gap-2 glass-button text-gray-200 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm shadow-md hover:shadow-lg hover:scale-105 border border-primary-500/20 hover:border-primary-500/40"
            title="Exporter pour Excel"
          >
            <Download size={16} strokeWidth={2.5} />
            <span className="hidden lg:inline">CSV</span>
          </button>
          <button 
            onClick={onDownloadMD}
            className="flex items-center justify-center gap-2 glass-button text-gray-200 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm shadow-md hover:shadow-lg hover:scale-105 border border-primary-500/20 hover:border-primary-500/40"
            title="Exporter les missions terminées en Markdown"
          >
            <FileText size={16} strokeWidth={2.5} />
            <span className="hidden lg:inline">MD</span>
          </button>
          <button 
            onClick={onDownloadPDF}
            className="flex items-center justify-center gap-2 glass-button text-gray-200 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm shadow-md hover:shadow-lg hover:scale-105 border border-primary-500/20 hover:border-primary-500/40 bg-primary-500/10"
            title="Exporter les missions terminées en PDF (pour paiement)"
          >
            <File size={16} strokeWidth={2.5} />
            <span className="hidden lg:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Contrôles et informations */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-primary-500/20 bg-gradient-to-r from-primary-500/5 via-primary-500/3 to-transparent">
        <div className="flex flex-wrap items-center gap-3">
          {/* Badge temps réel */}
          <div className="inline-flex items-center gap-2.5 rounded-full bg-green-500/15 border border-green-500/30 px-4 py-2 text-xs font-semibold text-green-200 shadow-md shadow-green-500/10">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50" />
            Mise à jour temps réel
          </div>
          
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
    </header>
  );
};

export default DashboardHeader;

