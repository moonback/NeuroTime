import React, { useState, useEffect, useMemo } from 'react';
import { Mission } from '../types';
import { X, Sparkles, MapPin, Calculator, Calendar, Briefcase, Euro, Moon, Sun, CheckCircle, ArrowRight, Copy, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { enhanceDescription } from '../services/geminiService';
import { calculateEarnings, calculateEarningsMultiple, RATE_DAY, RATE_NIGHT } from '../utils/calculations';
import { TimeSlot } from '../types';
import { Tooltip } from './Tooltip';

interface MissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mission: Mission) => void;
  initialData?: Mission | null;
  defaultDate?: string;
  missions?: Mission[]; // List for auto-complete/copy
}

const MissionForm: React.FC<MissionFormProps> = ({ isOpen, onClose, onSave, initialData, defaultDate, missions = [] }) => {
  // Base fields
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  // Time fields - Support multiple time slots
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { startTime: '09:00', endTime: '18:00' }
  ]);
  
  // Financial fields
  const [calculationMode, setCalculationMode] = useState<'auto' | 'manual'>('auto');
  const [manualTotal, setManualTotal] = useState<number>(0);
  
  // Computed state
  const [computedTotal, setComputedTotal] = useState<number>(0);
  const [dayHours, setDayHours] = useState<number>(0);
  const [nightHours, setNightHours] = useState<number>(0);
  
  const [status, setStatus] = useState<'planned' | 'completed' | 'cancelled'>('planned');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Validation
  const validateForm = useMemo(() => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (title.length < 3) {
      newErrors.title = 'Le titre doit contenir au moins 3 caractères';
    }
    
    if (!client.trim()) {
      newErrors.client = 'Le client est requis';
    }
    
    if (!location.trim()) {
      newErrors.location = 'Le lieu est requis';
    }
    
    if (!date) {
      newErrors.date = 'La date est requise';
    }
    
    // Validation des créneaux horaires
    if (timeSlots.length === 0) {
      newErrors.timeSlots = 'Au moins un créneau horaire est requis';
    }
    
    timeSlots.forEach((slot, index) => {
      if (!slot.startTime) {
        newErrors[`timeSlot_${index}_start`] = 'Heure de début requise';
      }
      if (!slot.endTime) {
        newErrors[`timeSlot_${index}_end`] = 'Heure de fin requise';
      }
      
      if (slot.startTime && slot.endTime) {
        const start = new Date(`${date}T${slot.startTime}`);
        let end = new Date(`${date}T${slot.endTime}`);
        if (end <= start) {
          end.setDate(end.getDate() + 1);
        }
        
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (diffHours > 24) {
          newErrors[`timeSlot_${index}_end`] = 'La durée ne peut pas dépasser 24 heures';
        }
        if (diffHours < 0.5) {
          newErrors[`timeSlot_${index}_end`] = 'La durée minimale est de 30 minutes';
        }
      }
    });
    
    // Validation manuelle
    if (calculationMode === 'manual' && manualTotal <= 0) {
      newErrors.manualTotal = 'Le montant doit être supérieur à 0';
    }
    
    return newErrors;
  }, [title, client, location, date, timeSlots, calculationMode, manualTotal]);

  // Initialize form
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setClient(initialData.client);
      setLocation(initialData.location);
      setDescription(initialData.description);
      
      const start = new Date(initialData.startTime);
      const end = new Date(initialData.endTime);
      
      setDate(formatDateForInput(start));
      
      // Gérer les créneaux horaires multiples ou un seul créneau
      if (initialData.timeSlots && initialData.timeSlots.length > 0) {
        setTimeSlots(initialData.timeSlots);
      } else {
        // Compatibilité avec les anciennes missions (un seul créneau)
        setTimeSlots([
          { startTime: formatTimeForInput(start), endTime: formatTimeForInput(end) }
        ]);
      }
      
      setStatus(initialData.status);

      if (initialData.rateType === 'custom') {
        setCalculationMode('manual');
        setManualTotal(initialData.totalEarnings);
      } else {
        setCalculationMode('auto');
      }
    } else {
      resetForm();
      if (defaultDate) {
        setDate(defaultDate);
      }
    }
  }, [initialData, isOpen, defaultDate]);


  // Auto-calculate logic pour plusieurs créneaux
  useEffect(() => {
    if (calculationMode === 'auto' && timeSlots.length > 0) {
      const result = calculateEarningsMultiple(date, timeSlots);
      setDayHours(result.dayHours);
      setNightHours(result.nightHours);
      setComputedTotal(result.total);
    }
  }, [timeSlots, date, calculationMode]);

  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];
  const formatTimeForInput = (d: Date) => d.toTimeString().slice(0, 5);

  const resetForm = () => {
    setTitle('');
    setClient('');
    setLocation('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTimeSlots([{ startTime: '09:00', endTime: '18:00' }]);
    setStatus('planned');
    setCalculationMode('auto');
    setManualTotal(0);
  };
  
  // Fonctions pour gérer les créneaux horaires
  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: '09:00', endTime: '18:00' }]);
  };
  
  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };
  
  const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
    // Effacer les erreurs pour ce champ
    if (errors[`timeSlot_${index}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`timeSlot_${index}_${field}`];
        return newErrors;
      });
    }
  };

  const handleCopyFromMission = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const missionId = e.target.value;
    const model = missions.find(m => m.id === missionId);
    if (model) {
      setTitle(model.title);
      setClient(model.client);
      setLocation(model.location);
      // We keep the current date, but copy the times
      if (model.timeSlots && model.timeSlots.length > 0) {
        setTimeSlots(model.timeSlots);
      } else {
        const start = new Date(model.startTime);
        const end = new Date(model.endTime);
        setTimeSlots([{ startTime: formatTimeForInput(start), endTime: formatTimeForInput(end) }]);
      }
      
      // Optional: Copy description? 
      // setDescription(model.description);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!description || !title) return;
    setIsEnhancing(true);
    try {
      const improved = await enhanceDescription(description, { title, client, location });
      setDescription(improved);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (Object.keys(validateForm).length > 0) {
      setErrors(validateForm);
      return;
    }
    
    setErrors({});
    
    // Calculer startTime et endTime pour compatibilité (premier et dernier créneau)
    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];
    
    const startIso = new Date(`${date}T${firstSlot.startTime}`).toISOString();
    let endObj = new Date(`${date}T${lastSlot.endTime}`);
    const startObj = new Date(`${date}T${firstSlot.startTime}`);
    
    if (endObj <= startObj) {
      endObj.setDate(endObj.getDate() + 1);
    }
    const endIso = endObj.toISOString();

    const finalTotal = calculationMode === 'auto' ? computedTotal : manualTotal;
    
    let finalRateType: 'day' | 'night' | 'mixed' | 'custom' = 'custom';
    if (calculationMode === 'auto') {
        if (dayHours > 0 && nightHours > 0) finalRateType = 'mixed';
        else if (nightHours > 0) finalRateType = 'night';
        else finalRateType = 'day';
    }

    const newMission: Mission = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      title,
      client,
      location,
      description,
      startTime: startIso, // Pour compatibilité
      endTime: endIso, // Pour compatibilité
      timeSlots: timeSlots.length > 1 ? timeSlots : undefined, // Stocker seulement si plusieurs créneaux
      status: status,
      rateType: finalRateType,
      hourlyRate: calculationMode === 'auto' ? RATE_DAY : 0, 
      totalEarnings: finalTotal,
      details: {
        dayHours,
        nightHours
      }
    };

    onSave(newMission);
    onClose();
  };

  if (!isOpen) return null;

  const isConverting = initialData?.status === 'planned' && status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 transition-all">
      <div className="glass-strong rounded-2xl md:rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className={`flex justify-between items-center p-4 md:p-6 border-b ${isConverting ? 'bg-green-500/20 border-green-500/30 glass-light' : 'border-primary-500/20 glass-light'}`}>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${isConverting ? 'text-green-300' : 'text-gray-100'}`}>
              {isConverting ? 'Valider les heures' : initialData ? 'Modifier la mission' : 'Nouvelle mission'}
            </h2>
            <p className={`text-[10px] md:text-xs mt-0.5 ${isConverting ? 'text-green-400' : 'text-gray-400'}`}>
              {isConverting ? 'Vérifiez les horaires réels pour finaliser le montant.' : 'Remplissez les détails pour votre suivi.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-dark-200 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6 space-y-6 md:space-y-8">
            
            {/* Template Selector (Only on new mission) */}
            {!initialData && missions.length > 0 && (
               <div className="bg-primary-500/20 border border-primary-500/30 rounded-lg p-2.5 md:p-3 flex items-center gap-2.5">
                 <Copy size={14} className="text-primary-400" />
                 <select 
                   onChange={handleCopyFromMission}
                   className="bg-transparent text-xs md:text-sm text-primary-300 font-medium w-full focus:outline-none cursor-pointer"
                   defaultValue=""
                 >
                   <option value="" disabled>Copier depuis une mission précédente...</option>
                   {missions.slice(-10).reverse().map(m => (
                     <option key={m.id} value={m.id} className="bg-dark-50">{m.title} - {m.client}</option>
                   ))}
                 </select>
               </div>
            )}

            {/* Section 1: Informations Générales */}
            <section className="space-y-3 md:space-y-4">
              <h3 className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={12} /> Détails de la mission
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1">
                    Titre de la mission
                    <Tooltip content="Nom descriptif de votre mission (ex: Régie Son, Accueil VIP)">
                      <AlertCircle size={12} className="text-gray-500 cursor-help" />
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                    }}
                    placeholder="Ex: Régie Son - Concert"
                    className={`w-full px-3 md:px-4 py-2 md:py-2.5 glass-light border-primary-500/20 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none transition-all text-sm text-gray-100 placeholder-gray-500 ${
                      errors.title ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.title}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1">
                    Client
                    <Tooltip content="Nom de l'entreprise ou du client pour cette mission">
                      <AlertCircle size={12} className="text-gray-500 cursor-help" />
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => {
                      setClient(e.target.value);
                      if (errors.client) setErrors(prev => ({ ...prev, client: '' }));
                    }}
                    placeholder="Ex: Event Pro Agency"
                    className={`w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500 ${
                      errors.client ? 'border-red-500/50' : 'border-dark-200'
                    }`}
                  />
                  {errors.client && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.client}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1">
                  <MapPin size={12} className="text-gray-500" /> Lieu
                  <Tooltip content="Adresse ou lieu de la mission">
                    <AlertCircle size={12} className="text-gray-500 cursor-help ml-1" />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                  }}
                  placeholder="Ex: Paris La Défense Arena"
                  className={`w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500 ${
                    errors.location ? 'border-red-500/50' : 'border-dark-200'
                  }`}
                />
                {errors.location && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.location}
                  </p>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Section 2: Date & Horaires */}
            <section className="space-y-3 md:space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Calculator size={12} /> Horaires & Calcul
                </h3>
                
                {/* Toggle Mode */}
                <div className="bg-gray-100 p-0.5 rounded-md flex text-[10px] md:text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setCalculationMode('auto')}
                    className={`px-2.5 md:px-3 py-0.5 md:py-1 rounded-md transition-all ${calculationMode === 'auto' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('manual')}
                    className={`px-2.5 md:px-3 py-0.5 md:py-1 rounded-md transition-all ${calculationMode === 'manual' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Manuel
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-gray-200">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                    }}
                    className={`w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-gray-100 ${
                      errors.date ? 'border-red-500/50' : 'border-dark-200'
                    }`}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.date}
                    </p>
                  )}
                </div>
                
                {/* Créneaux horaires multiples */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs md:text-sm font-medium text-gray-200">Créneaux horaires</label>
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 border border-primary-500/30 rounded-lg text-xs font-medium transition-all"
                    >
                      <Plus size={14} />
                      Ajouter un créneau
                    </button>
                  </div>
                  
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="glass-light rounded-lg p-3 md:p-4 border-primary-500/20 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-400">Créneau {index + 1}</span>
                        {timeSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                            title="Supprimer ce créneau"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400">Début</label>
                          <input
                            type="time"
                            required
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                            className={`w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none text-sm text-gray-100 ${
                              errors[`timeSlot_${index}_start`] ? 'border-red-500/50' : ''
                            }`}
                          />
                          {errors[`timeSlot_${index}_start`] && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle size={10} /> {errors[`timeSlot_${index}_start`]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400">Fin</label>
                          <input
                            type="time"
                            required
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                            className={`w-full px-3 py-2 glass-light border-primary-500/20 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none text-sm text-gray-100 ${
                              errors[`timeSlot_${index}_end`] ? 'border-red-500/50' : ''
                            }`}
                          />
                          {errors[`timeSlot_${index}_end`] && (
                            <p className="text-xs text-red-400 flex items-center gap-1">
                              <AlertCircle size={10} /> {errors[`timeSlot_${index}_end`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {errors.timeSlots && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.timeSlots}
                    </p>
                  )}
                </div>
              </div>

              {/* Smart Calculator Display */}
              <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all ${status === 'completed' ? 'bg-green-500/20 border-green-500/30 glass-card' : 'glass-card border-primary-500/20'}`}>
                
                {calculationMode === 'auto' ? (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-start gap-4">
                       <div>
                         <label className="text-xs md:text-sm font-bold text-gray-200 block mb-1">Calcul Automatique</label>
                         <p className="text-[10px] md:text-xs text-gray-400">Jour ({RATE_DAY}€) et nuit ({RATE_NIGHT}€ {'>'} 22h)</p>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] md:text-xs text-gray-400 block mb-1 uppercase tracking-wide">Total Estimé</span>
                          <span className={`text-2xl md:text-3xl font-bold flex items-center justify-end gap-1 ${status === 'completed' ? 'text-green-300' : 'text-primary-300'}`}>
                            {computedTotal.toFixed(2)} <Euro size={20} strokeWidth={2.5} />
                          </span>
                       </div>
                    </div>

                    {/* Visual Bar Breakdown */}
                    {(dayHours > 0 || nightHours > 0) && (
                      <div className="glass-light rounded-xl border-primary-500/20 p-3">
                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-dark-200 mb-3">
                          {dayHours > 0 && (
                            <div className="bg-orange-400 h-full" style={{ width: `${(dayHours / (dayHours + nightHours)) * 100}%` }} />
                          )}
                           {nightHours > 0 && (
                            <div className="bg-primary-500 h-full" style={{ width: `${(nightHours / (dayHours + nightHours)) * 100}%` }} />
                          )}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          {dayHours > 0 ? (
                             <div className="flex items-center gap-2 text-gray-200">
                               <Sun size={16} className="text-orange-400" />
                               <span className="font-semibold">{dayHours.toFixed(1)}h</span>
                               <span className="text-gray-400">× {RATE_DAY}€</span>
                             </div>
                          ) : <span />}
                          
                          {nightHours > 0 ? (
                             <div className="flex items-center gap-2 text-gray-200">
                               <Moon size={16} className="text-primary-400" />
                               <span className="font-semibold">{nightHours.toFixed(1)}h</span>
                               <span className="text-gray-400">× {RATE_NIGHT}€</span>
                             </div>
                          ) : <span />}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Manual Mode
                   <div className="flex items-center justify-between gap-4">
                     <div className="flex-1">
                        <label className="text-sm font-bold text-gray-200 block mb-1">Montant Forfaitaire</label>
                         <p className="text-xs text-gray-400">Saisie manuelle du total</p>
                     </div>
                     <div className="w-1/2">
                       <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={manualTotal}
                          onChange={(e) => setManualTotal(parseFloat(e.target.value))}
                          className="w-full pl-4 pr-10 py-3 glass-light border-primary-500/20 rounded-xl text-right font-bold text-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none text-gray-100"
                        />
                        <Euro className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                       </div>
                     </div>
                   </div>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Section 3: IA & Notes */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} /> Description (IA)
                </h3>
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancing || !description}
                  className="text-xs flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={12} />
                  {isEnhancing ? 'Réécriture en cours...' : 'Reformuler pro'}
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes rapides : monté les spots, câblage régie, fin 2h du mat..."
                  rows={3}
                  className="w-full px-4 py-3 glass-light border-primary-500/20 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 outline-none transition-all resize-none text-sm leading-relaxed text-gray-100 placeholder-gray-500"
                />
              </div>
            </section>

            {/* Status Selector */}
             <div className="flex gap-4 items-center glass-light p-3 rounded-xl border-primary-500/20">
               <span className="text-sm font-medium text-gray-200 pl-2">Statut :</span>
               <div className="flex gap-2">
                 {(['planned', 'completed', 'cancelled'] as const).map(s => (
                   <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all capitalize ${
                      status === s 
                      ? s === 'completed' ? 'bg-green-500/20 border-green-500/30 text-green-300 font-bold' 
                        : s === 'cancelled' ? 'bg-red-500/20 border-red-500/30 text-red-300 font-bold'
                        : 'bg-primary-500/20 border-primary-500/30 text-primary-300 font-bold'
                      : 'glass-button text-gray-400 hover:text-primary-300'
                    }`}
                   >
                     {s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 md:p-6 border-t border-primary-500/20 glass-light flex gap-3 md:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl glass-button text-gray-200 font-semibold hover:shadow-sm transition-all text-sm md:text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`flex-[2] bg-gradient-to-r text-dark-300 font-semibold py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl shadow-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 text-sm md:text-base ${
                isConverting 
                ? 'from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-green-500/30' 
                : 'from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-primary-500/30'
              }`}
            >
               {isConverting ? <CheckCircle size={16} /> : <Calendar size={16} />}
              {isConverting ? 'Valider les heures' : initialData ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MissionForm;