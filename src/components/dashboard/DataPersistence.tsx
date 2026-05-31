import React, { useRef } from 'react';
import { Database, Save, Upload } from 'lucide-react';
import { Mission } from '../../types';
import { toast } from 'sonner';

interface DataPersistenceProps {
  onImport: (missions: Mission[]) => void;
  onBackup: () => void;
}

const DataPersistence: React.FC<DataPersistenceProps> = ({ onImport, onBackup }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImport(json);
          toast.success('Fichier importé. Vérifiez vos missions.');
        } else {
          toast.error('Le fichier ne semble pas valide.');
        }
      } catch (err) {
        toast.error('Erreur lors de la lecture du fichier de sauvegarde.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="glass-card rounded-xl p-4 animate-slide-in-up md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.035] p-2.5 text-[var(--accent)]">
            <Database size={17} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sauvegarde et restauration</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Exportez une copie locale ou restaurez vos données depuis un fichier JSON.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:min-w-[260px]">
          <button
            onClick={onBackup}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-3 text-sm font-semibold"
          >
            <Save size={14} />
            Sauvegarder
          </button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-3 text-sm font-semibold"
            >
              <Upload size={14} />
              Restaurer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataPersistence;
