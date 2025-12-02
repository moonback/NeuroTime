import React, { useState, useRef } from 'react';
import { X, Upload, Scan, CheckCircle, AlertCircle, Loader2, Camera, FileImage } from 'lucide-react';
import { extractMissionsFromImage, ExtractedMission } from '../services/geminiService';
import { Mission } from '../types';
import { calculateEarningsMultiple, RATE_DAY, RATE_NIGHT } from '../utils/calculations';

interface ScanMissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missions: Mission[]) => void;
}

const ScanMissionForm: React.FC<ScanMissionFormProps> = ({ isOpen, onClose, onSave }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedMissions, setExtractedMissions] = useState<ExtractedMission[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image');
        return;
      }
      setImageFile(file);
      setError(null);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imageFile) {
      setError('Veuillez d\'abord sélectionner une image');
      return;
    }

    setIsScanning(true);
    setError(null);
    setExtractedMissions([]);

    try {
      const missions = await extractMissionsFromImage(imageFile);
      setExtractedMissions(missions);
      
      if (missions.length === 0) {
        setError('Aucune mission n\'a été trouvée sur cette fiche. Vérifiez que l\'image est claire et contient des informations de mission.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du scan de l\'image');
      console.error('Erreur scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleEditMission = (index: number, field: keyof ExtractedMission, value: string) => {
    const updated = [...extractedMissions];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedMissions(updated);
  };

  const convertToMission = (extracted: ExtractedMission): Mission => {
    const date = extracted.date || new Date().toISOString().split('T')[0];
    const startTime = extracted.startTime || '09:00';
    
    // Si endTime n'est pas fourni, on utilise une heure par défaut (sera modifiée à la fin de la livraison)
    const endTime = extracted.endTime || '18:00';
    
    const startIso = new Date(`${date}T${startTime}`).toISOString();
    let endObj = new Date(`${date}T${endTime}`);
    const startObj = new Date(`${date}T${startTime}`);
    
    if (endObj <= startObj) {
      endObj.setDate(endObj.getDate() + 1);
    }
    const endIso = endObj.toISOString();

    // Calculer les gains si l'heure de fin est fournie
    let totalEarnings = 0;
    let dayHours = 0;
    let nightHours = 0;
    let rateType: 'day' | 'night' | 'mixed' | 'custom' = 'day';

    if (extracted.endTime) {
      const timeSlots = [{ startTime, endTime }];
      const result = calculateEarningsMultiple(date, timeSlots);
      totalEarnings = result.total;
      dayHours = result.dayHours;
      nightHours = result.nightHours;
      
      if (dayHours > 0 && nightHours > 0) rateType = 'mixed';
      else if (nightHours > 0) rateType = 'night';
      else rateType = 'day';
    }

    return {
      id: crypto.randomUUID(),
      title: extracted.title,
      client: extracted.client,
      location: extracted.location,
      description: extracted.description || '',
      startTime: startIso,
      endTime: endIso,
      timeSlots: extracted.endTime ? [{ startTime, endTime }] : undefined,
      status: 'planned' as const,
      rateType,
      hourlyRate: RATE_DAY,
      totalEarnings,
      details: extracted.endTime ? { dayHours, nightHours } : undefined,
    };
  };

  const handleSaveAll = () => {
    if (extractedMissions.length === 0) {
      setError('Aucune mission à sauvegarder');
      return;
    }

    const missions = extractedMissions.map(convertToMission);
    onSave(missions);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setExtractedMissions([]);
    setError(null);
    setEditingIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMission = (index: number) => {
    setExtractedMissions(extractedMissions.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 transition-all animate-fade-in">
      <div className="glass-strong rounded-2xl md:rounded-3xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-primary-500/20 glass-light relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <h2 className="text-lg md:text-xl font-bold text-gray-100 flex items-center gap-2">
              <Scan size={20} className="text-primary-400" />
              Scanner une fiche de demande
            </h2>
            <p className="text-[10px] md:text-xs mt-0.5 text-gray-400">
              Téléchargez une photo de votre fiche pour extraire automatiquement les missions
            </p>
          </div>
          <button 
            onClick={() => { handleReset(); onClose(); }} 
            className="p-1.5 md:p-2 hover:bg-dark-200 rounded-full transition-all text-gray-400 hover:scale-110 relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-4 md:p-6 space-y-6">
            
            {/* Upload Section */}
            {!imagePreview && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary-500/30 rounded-xl p-8 md:p-12 text-center cursor-pointer hover:border-primary-500/50 transition-all glass-light hover:bg-primary-500/5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload size={48} className="mx-auto mb-4 text-primary-400" />
                  <p className="text-gray-200 font-medium mb-2">Cliquez pour télécharger une image</p>
                  <p className="text-xs text-gray-400">Formats supportés : JPG, PNG, WebP</p>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && !extractedMissions.length && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-primary-500/20 glass-light">
                  <img 
                    src={imagePreview} 
                    alt="Aperçu" 
                    className="w-full h-auto max-h-96 object-contain"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-dark-300 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  {isScanning ? (
                    <>
                      <Loader2 size={20} className="animate-spin relative z-10" />
                      <span className="relative z-10">Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <Scan size={20} className="relative z-10" />
                      <span className="relative z-10">Analyser la fiche</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-300 font-medium text-sm">Erreur</p>
                  <p className="text-red-400 text-xs mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Extracted Missions */}
            {extractedMissions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-200">
                    Missions extraites ({extractedMissions.length})
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                  >
                    <X size={14} />
                    Recommencer
                  </button>
                </div>

                <div className="space-y-3">
                  {extractedMissions.map((mission, index) => (
                    <div 
                      key={index}
                      className="glass-light rounded-xl p-4 border border-primary-500/20 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Titre</label>
                              <input
                                type="text"
                                value={mission.title}
                                onChange={(e) => handleEditMission(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Client</label>
                              <input
                                type="text"
                                value={mission.client}
                                onChange={(e) => handleEditMission(index, 'client', e.target.value)}
                                className="w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">Lieu</label>
                              <input
                                type="text"
                                value={mission.location}
                                onChange={(e) => handleEditMission(index, 'location', e.target.value)}
                                className="w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Date</label>
                                <input
                                  type="date"
                                  value={mission.date}
                                  onChange={(e) => handleEditMission(index, 'date', e.target.value)}
                                  className="w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">Début</label>
                                <input
                                  type="time"
                                  value={mission.startTime}
                                  onChange={(e) => handleEditMission(index, 'startTime', e.target.value)}
                                  className="w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                  Fin {!mission.endTime && <span className="text-primary-400">(à compléter)</span>}
                                </label>
                                <input
                                  type="time"
                                  value={mission.endTime || ''}
                                  onChange={(e) => handleEditMission(index, 'endTime', e.target.value)}
                                  placeholder="À compléter"
                                  className="w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none"
                                />
                              </div>
                            </div>
                            {mission.description && (
                              <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                                <textarea
                                  value={mission.description}
                                  onChange={(e) => handleEditMission(index, 'description', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none resize-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMission(index)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors ml-2"
                          title="Supprimer cette mission"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
                  <p className="text-xs text-gray-300">
                    <strong className="text-primary-300">Note :</strong> Les heures de fin non renseignées pourront être complétées à la fin de la livraison lors de la validation de la mission.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {extractedMissions.length > 0 && (
          <div className="p-4 md:p-6 border-t border-primary-500/20 glass-light flex gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => { handleReset(); onClose(); }}
              className="flex-1 py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl glass-button text-gray-200 font-semibold hover:shadow-sm transition-all text-sm md:text-base"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex-[2] bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-dark-300 font-semibold py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm md:text-base relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <CheckCircle size={18} className="relative z-10" />
              <span className="relative z-10">Enregistrer {extractedMissions.length} mission{extractedMissions.length > 1 ? 's' : ''}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanMissionForm;

