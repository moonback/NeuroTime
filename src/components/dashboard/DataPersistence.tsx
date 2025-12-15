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
    // Reset value so we can load same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="glass-card rounded-2xl p-4 md:p-5 animate-slide-in-up">
       <div className="flex items-center gap-2.5 mb-3">
          <div className="bg-dark-100 p-1.5 rounded-lg text-gray-300 border border-dark-200 group-hover:border-primary-500/50 transition-colors">
            <Database size={18} />
          </div>
          <h3 className="text-base md:text-lg font-bold text-gray-100">Sauvegarde</h3>
       </div>
       <p className="text-xs md:text-sm text-gray-400 mb-4">
         Sauvegardez régulièrement vos données pour éviter toute perte.
       </p>

       <div className="flex flex-col sm:flex-row gap-2.5">
         <button 
           onClick={onBackup}
           className="flex items-center justify-center gap-2 glass-button text-gray-200 font-medium py-2.5 px-4 rounded-lg hover:border-primary-500/50 transition-all flex-1 text-sm"
         >
           <Save size={16} />
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
             className="w-full flex items-center justify-center gap-2 glass-button text-gray-200 font-medium py-2.5 px-4 rounded-lg hover:border-primary-500/50 transition-all text-sm"
           >
             <Upload size={16} />
             Restaurer
           </button>
         </div>
       </div>
    </div>
  );
};

export default DataPersistence;

