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
    <div className="glass-card rounded-xl p-3 md:p-3.5 animate-slide-in-up">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-gray-400">
          <Database size={14} />
        </div>
        <h3 className="text-xs font-bold text-gray-200">Sauvegarde</h3>
      </div>
      <p className="text-[10px] text-gray-500 mb-3">
        Sauvegardez régulièrement vos données.
      </p>

      <div className="flex gap-2">
        <button
          onClick={onBackup}
          className="flex items-center justify-center gap-1.5 glass-button text-gray-300 font-medium py-2 px-3 rounded-lg hover:border-indigo-500/30 transition-all flex-1 text-[11px]"
        >
          <Save size={13} />
          Sauvegarder
        </button>

        <div className="flex-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 glass-button text-gray-300 font-medium py-2 px-3 rounded-lg hover:border-indigo-500/30 transition-all text-[11px]"
          >
            <Upload size={13} />
            Restaurer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataPersistence;
