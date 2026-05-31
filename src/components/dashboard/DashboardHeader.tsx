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

  const exportOptions = [
    { label: 'Rapport PDF', description: 'Mise en page premium prête à partager', action: onDownloadPDF, icon: <File size={16} /> },
    { label: 'Markdown', description: 'Synthèse éditable pour vos notes', action: onDownloadMD, icon: <File size={16} /> },
    { label: 'CSV', description: 'Données brutes pour tableur', action: onDownloadCSV, icon: <Download size={16} /> },
  ];

  return (
    <header className="space-y-4 animate-slide-in-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white/[0.025] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Live Monitor
          </div>
          <div>
            <h1 className="font-display text-[var(--text-primary)]">Tableau de bord</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Pilotage financier, activité et missions pour {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="btn-secondary px-4 py-2 text-[12px]"
        >
          <Share2 size={15} strokeWidth={2.25} className="text-[var(--accent)]" />
          Exporter
        </button>
      </div>

      <div className="surface-card flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <label htmlFor="month-selector" className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-white/[0.025] px-3 py-2">
          <Calendar className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />
          <span className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Période</span>
            <input
              id="month-selector"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="min-h-0 border-none bg-transparent p-0 text-sm font-semibold text-[var(--text-primary)] focus:shadow-none"
              style={{ colorScheme: 'dark' }}
            />
          </span>
        </label>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold capitalize text-[var(--text-primary)]">
          {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
        </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in" onClick={() => setIsExportModalOpen(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] sm:rounded-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[var(--border-default)] bg-white/[0.035] p-2 text-[var(--accent)]">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Exporter le rapport</h3>
                  <p className="text-xs text-[var(--text-muted)] capitalize">{format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}</p>
                </div>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="btn-ghost min-h-0 p-2" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 p-4">
              {exportOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => { option.action(); setIsExportModalOpen(false); }}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.025] p-4 text-left transition hover:border-[var(--border-default)] hover:bg-white/[0.045]"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2 text-[var(--accent)]">{option.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--text-primary)]">{option.label}</span>
                      <span className="block text-xs text-[var(--text-muted)]">{option.description}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
