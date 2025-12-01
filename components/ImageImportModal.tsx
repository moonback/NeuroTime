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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-purple-600" />
              Scanner Planning IA
            </h2>
            <p className="text-sm text-gray-500">Transformez une photo de votre agenda en missions.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
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
                  previewUrl ? 'border-purple-200 bg-purple-50/30' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }`}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-xl" />
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-purple-600" size={32} />
                    </div>
                    <p className="font-medium">Cliquez pour ajouter une photo</p>
                    <p className="text-xs mt-1">Format JPG, PNG</p>
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
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  {isAnalyzing ? 'Analyse en cours...' : 'Analyser avec Gemini'}
                </button>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}
            </div>

            {/* Right Column: Results */}
            <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  Missions détectées
                  {extractedMissions.length > 0 && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                      {extractedMissions.length}
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {extractedMissions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                    <ImageIcon size={48} className="mb-4 opacity-20" />
                    <p>Les missions extraites apparaîtront ici.</p>
                  </div>
                ) : (
                  extractedMissions.map((m, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-800">{m.title}</span>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {m.date}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500 mb-1">
                        <span>{m.startTime} - {m.endTime}</span>
                        <span>{m.client}</span>
                      </div>
                      <div className="text-xs text-purple-600 bg-purple-50 inline-block px-2 py-0.5 rounded">
                        {m.location}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {extractedMissions.length > 0 && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
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