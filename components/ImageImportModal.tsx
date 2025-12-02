import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Mission } from '../types';
import { parseScheduleImage, ExtractedMissionData } from '../services/geminiService';
import { calculateEarnings, RATE_DAY, RATE_NIGHT } from '../utils/calculations';

interface ImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (missions: Mission[]) => void;
}

const ImageImportModal: React.FC<ImageImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedMissions, setExtractedMissions] = useState<ExtractedMissionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setExtractedMissions([]);
      setError(null);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64 = await convertFileToBase64(selectedFile);
      const data = await parseScheduleImage(base64);
      
      if (data.length === 0) {
        setError("Aucune mission n'a été détectée. Essayez une image plus claire.");
      } else {
        setExtractedMissions(data);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'analyse. Vérifiez votre connexion.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmImport = () => {
    const newMissions: Mission[] = extractedMissions.map(data => {
      // Calculate earnings for each extracted mission
      const financial = calculateEarnings(data.date, data.startTime, data.endTime);
      
      // Handle overnight date shift for endTime ISO
      const startIso = new Date(`${data.date}T${data.startTime}`).toISOString();
      const endObj = new Date(`${data.date}T${data.endTime}`);
      const startObj = new Date(`${data.date}T${data.startTime}`);
      if (endObj <= startObj) {
        endObj.setDate(endObj.getDate() + 1);
      }
      
      return {
        id: crypto.randomUUID(),
        title: data.title || "Mission Importée",
        client: data.client || "Client Inconnu",
        location: data.location || "",
        description: data.description || "Importé depuis planning",
        startTime: startIso,
        endTime: endObj.toISOString(),
        status: 'planned',
        rateType: financial.rateType,
        hourlyRate: RATE_DAY,
        totalEarnings: financial.total,
        details: {
          dayHours: financial.dayHours,
          nightHours: financial.nightHours
        }
      };
    });

    onImport(newMissions);
    onClose();
    // Reset state
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedMissions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-strong rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-primary-500/20 glass-light">
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Sparkles className="text-primary-400" />
              Scanner Planning IA
            </h2>
            <p className="text-sm text-gray-400">Transformez une photo de votre agenda en missions.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-200 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            
            {/* Left Column: Upload & Preview */}
            <div className="flex flex-col gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  previewUrl ? 'border-primary-500/50 bg-primary-500/10 glass-light' : 'border-primary-500/20 hover:border-primary-500/50 hover:glass-button'
                }`}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-xl" />
                ) : (
                  <div className="text-center p-6 text-gray-400">
                    <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
                      <Upload className="text-primary-400" size={32} />
                    </div>
                    <p className="font-medium text-gray-300">Cliquez pour ajouter une photo</p>
                    <p className="text-xs mt-1 text-gray-500">Format JPG, PNG</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {selectedFile && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-dark-300 font-bold glow-blue disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  {isAnalyzing ? 'Analyse en cours...' : 'Analyser avec Gemini'}
                </button>
              )}

              {error && (
                <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}
            </div>

            {/* Right Column: Results */}
            <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-primary-500/20 glass-light">
                <h3 className="font-bold text-gray-100 flex items-center gap-2">
                  Missions détectées
                  {extractedMissions.length > 0 && (
                    <span className="bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full text-xs border border-primary-500/30">
                      {extractedMissions.length}
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {extractedMissions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center p-8">
                    <ImageIcon size={48} className="mb-4 opacity-20" />
                    <p>Les missions extraites apparaîtront ici.</p>
                  </div>
                ) : (
                  extractedMissions.map((m, idx) => (
                    <div key={idx} className="glass-light p-3 rounded-xl border-primary-500/20 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-100">{m.title}</span>
                        <span className="text-xs font-mono glass-button px-2 py-1 rounded text-gray-400">
                          {m.date}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400 mb-1">
                        <span>{m.startTime} - {m.endTime}</span>
                        <span>{m.client}</span>
                      </div>
                      <div className="text-xs text-primary-300 bg-primary-500/20 inline-block px-2 py-0.5 rounded border border-primary-500/30">
                        {m.location}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {extractedMissions.length > 0 && (
                <div className="p-4 glass-light border-t border-primary-500/20">
                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-dark-300 font-bold glow-blue flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Valider & Importer
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageImportModal;