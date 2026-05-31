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
    <header className="space-y-4 animate-slide-in-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />
            Live Monitor
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.055em] text-[var(--text-primary)] md:text-5xl">
            Tableau de bord
          </h1>
          <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
            Pilotage mensuel de vos missions, revenus et prochaines échéances.
          </p>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="btn-secondary inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold"
        >
          <Share2 size={16} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Exporter</span>
        </button>
      </div>

      <div className="glass-card flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <label htmlFor="month-selector" className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-white/[0.025] px-3 py-2">
          <Calendar className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />
          <span className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Période
            </span>
            <input
              id="month-selector"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="min-h-0 cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-[var(--text-primary)] shadow-none focus:shadow-none"
              style={{ colorScheme: 'dark' }}
            />
          </span>
        </label>

        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold capitalize text-[var(--text-primary)]">
          {format(selectedMonthDate, 'MMMM yyyy', { locale: fr })}
        </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" onClick={() => setIsExportModalOpen(false)}>
          <div className="glass-card w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-default)] animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-white/[0.04] p-2 text-[var(--accent)]">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Exporter le rapport</h3>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mt-1 min-h-0 cursor-pointer border-none bg-transparent p-0 text-xs font-medium text-[var(--text-secondary)] shadow-none"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="btn-ghost inline-flex h-9 min-h-0 w-9 items-center justify-center p-0"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 p-5">
              <button
                onClick={() => { onDownloadCSV(); setIsExportModalOpen(false); }}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.025] p-4 text-left transition-colors hover:border-[var(--border-default)] hover:bg-white/[0.045]"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--accent)]"><File size={18} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Fichier CSV</h4>
                    <p className="text-xs text-[var(--text-muted)]">Données brutes pour tableur</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => { onDownloadMD(); setIsExportModalOpen(false); }}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.025] p-4 text-left transition-colors hover:border-[var(--border-default)] hover:bg-white/[0.045]"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--accent)]"><File size={18} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Rapport Markdown</h4>
                    <p className="text-xs text-[var(--text-muted)]">Synthèse éditable et légère</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => { onDownloadPDF(); setIsExportModalOpen(false); }}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.025] p-4 text-left transition-colors hover:border-[var(--border-default)] hover:bg-white/[0.045]"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg border border-[var(--border-subtle)] p-2 text-[var(--danger)]"><File size={18} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Document PDF</h4>
                    <p className="text-xs text-[var(--text-muted)]">Rapport optimisé pour impression</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="px-5 pb-5 text-center text-[11px] text-[var(--text-muted)]">
              Les exports concernent le mois affiché.
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
