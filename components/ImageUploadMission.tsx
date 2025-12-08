import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { analyzeImageAndExtractMissions } from '../services/geminiService';
import { Mission } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface ImageUploadMissionProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missions: Mission[]) => void;
}

const ImageUploadMission: React.FC<ImageUploadMissionProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedMissions, setExtractedMissions] = useState<Partial<Mission>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMissions, setSelectedMissions] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image (JPG, PNG, etc.)');
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('L\'image est trop volumineuse. Taille maximale : 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setExtractedMissions([]);
    setSelectedMissions(new Set());

    // Créer une preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setExtractedMissions([]);

    try {
      // Convertir l'image en base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Enlever le préfixe data:image/...;base64,
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Analyser avec Gemini
      const missions = await analyzeImageAndExtractMissions(base64, selectedFile.type);
      
      if (missions.length === 0) {
        setError('Aucune mission n\'a été détectée dans l\'image. Assurez-vous que l\'image contient des informations de planning ou de missions.');
      } else {
        setExtractedMissions(missions);
        // Sélectionner toutes les missions par défaut
        setSelectedMissions(new Set(missions.map((_, index) => index)));
      }
    } catch (err) {
      console.error('Erreur lors de l\'analyse:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse de l\'image. Vérifiez votre connexion et votre clé API Gemini.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleMission = (index: number) => {
    const newSelected = new Set(selectedMissions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMissions(newSelected);
  };

  const handleAddMissions = () => {
    const missionsToAdd: Mission[] = extractedMissions
      .filter((_, index) => selectedMissions.has(index))
      .map((mission) => ({
        id: crypto.randomUUID(),
        title: mission.title || 'Mission sans titre',
        client: mission.client || 'Client non spécifié',
        location: mission.location || 'Lieu non spécifié',
        description: mission.description || '',
        startTime: mission.startTime || new Date().toISOString(),
        endTime: mission.endTime || new Date().toISOString(),
        status: (mission.status as 'planned' | 'completed' | 'cancelled') || 'planned',
        rateType: mission.rateType || 'day',
        hourlyRate: mission.hourlyRate || 0,
        totalEarnings: mission.totalEarnings || 0,
        isPaid: false,
      }));

    if (missionsToAdd.length > 0) {
      onSave(missionsToAdd);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setExtractedMissions([]);
    setSelectedMissions(new Set());
    setError(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-4 transition-all animate-fade-in">
      <div className="glass-strong rounded-2xl md:rounded-3xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-primary-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg border border-primary-500/30">
              <ImageIcon size={20} className="text-primary-300" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-50">Importer depuis une photo</h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">Analysez un planning ou un document avec Gemini AI</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-dark-100/50 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-5">
          {/* Upload Section */}
          {!preview && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary-500/30 rounded-xl p-8 md:p-12 text-center cursor-pointer hover:border-primary-500/50 transition-colors bg-dark-100/30"
              >
                <Upload size={40} className="mx-auto text-primary-400 mb-4" strokeWidth={2} />
                <p className="text-gray-200 font-semibold mb-2">Cliquez pour sélectionner une image</p>
                <p className="text-xs text-gray-400">JPG, PNG (max 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview Section */}
          {preview && !isAnalyzing && extractedMissions.length === 0 && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-primary-500/20 bg-dark-100/30">
                <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-2 bg-dark-300/90 hover:bg-dark-300 rounded-lg transition-colors text-gray-300 hover:text-gray-100"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon size={18} strokeWidth={2.5} />
                <span>Analyser l'image avec Gemini</span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 size={48} className="text-primary-400 animate-spin" strokeWidth={2} />
              <p className="text-gray-300 font-medium">Analyse de l'image en cours...</p>
              <p className="text-xs text-gray-400 text-center">Gemini AI est en train d'extraire les missions de votre document</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-red-200 font-semibold text-sm">Erreur</p>
                <p className="text-red-300 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Extracted Missions */}
          {extractedMissions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-50">
                  {extractedMissions.length} mission{extractedMissions.length > 1 ? 's' : ''} détectée{extractedMissions.length > 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => {
                    if (selectedMissions.size === extractedMissions.length) {
                      setSelectedMissions(new Set());
                    } else {
                      setSelectedMissions(new Set(extractedMissions.map((_, index) => index)));
                    }
                  }}
                  className="text-xs text-primary-300 hover:text-primary-200 font-medium"
                >
                  {selectedMissions.size === extractedMissions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {extractedMissions.map((mission, index) => (
                  <div
                    key={index}
                    onClick={() => handleToggleMission(index)}
                    className={`glass-light rounded-xl p-4 border-2 cursor-pointer transition-all ${
                      selectedMissions.has(index)
                        ? 'border-primary-500/50 bg-primary-500/10'
                        : 'border-primary-500/20 hover:border-primary-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedMissions.has(index)
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-500'
                      }`}>
                        {selectedMissions.has(index) && (
                          <CheckCircle2 size={14} className="text-dark-300" strokeWidth={3} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-50 text-base mb-1">{mission.title}</h4>
                        <div className="space-y-1.5 text-xs text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary-300">Client:</span>
                            <span>{mission.client}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary-300">Lieu:</span>
                            <span>{mission.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary-300">Date:</span>
                            <span>
                              {mission.startTime
                                ? format(new Date(mission.startTime), 'dd MMM yyyy à HH:mm', { locale: fr })
                                : 'Non spécifié'}
                            </span>
                          </div>
                          {mission.totalEarnings && mission.totalEarnings > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary-300">Montant:</span>
                              <span className="text-emerald-300 font-bold">{mission.totalEarnings}€</span>
                            </div>
                          )}
                          {mission.description && (
                            <p className="text-gray-400 mt-2 italic">{mission.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {extractedMissions.length > 0 && (
          <div className="border-t border-primary-500/20 p-5 md:p-6 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              {selectedMissions.size} mission{selectedMissions.size > 1 ? 's' : ''} sélectionnée{selectedMissions.size > 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 glass-button text-gray-300 hover:text-gray-100 rounded-xl font-semibold text-sm transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMissions}
                disabled={selectedMissions.size === 0}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Ajouter {selectedMissions.size > 0 && `(${selectedMissions.size})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadMission;

