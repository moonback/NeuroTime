import React, { useState, useEffect, useMemo } from 'react';
import { Mission } from '../types';
import { X, Sparkles, MapPin, Calculator, Calendar, Briefcase, Euro, Moon, Sun, CheckCircle, ArrowRight, Copy, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { enhanceDescription } from '../services/geminiService';
import { calculateEarnings, calculateEarningsMultiple, RATE_DAY, RATE_NIGHT } from '../utils/calculations';
import { TimeSlot } from '../types';
import { Tooltip } from './Tooltip';
import { getAllClients, addClient, Client, syncClientsWithMissions } from '../services/clientService';
import { findDuplicateMissions, formatConflictMessage } from '../utils/missionValidation';
import { usePreferences } from '../hooks/usePreferences';

interface MissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mission: Mission) => void;
  initialData?: Mission | null;
  defaultDate?: string;
  missions?: Mission[]; // List for auto-complete/copy
  hidePrices?: boolean;
}

const MissionForm: React.FC<MissionFormProps> = ({ isOpen, onClose, onSave, initialData, defaultDate, missions = [], hidePrices = false }) => {
  // Fonction utilitaire pour formater les montants avec masquage optionnel
  const formatPrice = (value: number | null | undefined, decimals: number = 0): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toFixed(decimals);
  };
  // Base fields
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const { dayRate: prefDayRate, nightRate: prefNightRate } = usePreferences();

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
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');

  // Client management
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');

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

  // Load clients when form opens
  useEffect(() => {
    if (isOpen && missions) {
      const loadClients = async () => {
        try {
          await syncClientsWithMissions(missions);
          const allClients = await getAllClients(missions);
          setClients(allClients);
        } catch (error) {
          console.error('Erreur lors du chargement des clients:', error);
        }
      };
      loadClients();
    }
  }, [isOpen, missions]);

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
        const validSlots = initialData.timeSlots.filter(slot =>
          slot && slot.startTime && slot.endTime &&
          slot.startTime.trim() !== '' && slot.endTime.trim() !== ''
        );
        if (validSlots.length > 0) {
          setTimeSlots(validSlots);
        } else {
          setTimeSlots([
            { startTime: formatTimeForInput(start), endTime: formatTimeForInput(end) }
          ]);
        }
      } else {
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

      setIsAddingNewClient(false);
      setNewClientName('');
    } else {
      resetForm();
      if (defaultDate) {
        setDate(defaultDate);
      }
      setIsAddingNewClient(false);
      setNewClientName('');
    }
  }, [initialData, isOpen, defaultDate]);


  // Auto-calculate logic pour plusieurs créneaux
  useEffect(() => {
    if (calculationMode === 'auto' && timeSlots.length > 0 && date) {
      const hasValidSlots = timeSlots.every(slot =>
        slot.startTime && slot.endTime &&
        slot.startTime.trim() !== '' && slot.endTime.trim() !== ''
      );

      if (hasValidSlots) {
        try {
          const result = calculateEarningsMultiple(date, timeSlots, prefDayRate, prefNightRate);
          setDayHours(result.dayHours);
          setNightHours(result.nightHours);
          setComputedTotal(result.total);
        } catch (error) {
          console.error('Erreur lors du calcul automatique:', error);
          setDayHours(0);
          setNightHours(0);
          setComputedTotal(0);
        }
      } else {
        setDayHours(0);
        setNightHours(0);
        setComputedTotal(0);
      }
    }
  }, [timeSlots, date, calculationMode, prefDayRate, prefNightRate]);

  // Détection de doublons (date/heure)
  useEffect(() => {
    if (!date || timeSlots.length === 0 || !title.trim()) {
      setDuplicateWarning('');
      return;
    }

    const hasValidSlots = timeSlots.every(slot =>
      slot.startTime && slot.endTime &&
      slot.startTime.trim() !== '' && slot.endTime.trim() !== ''
    );

    if (!hasValidSlots) {
      setDuplicateWarning('');
      return;
    }

    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];
    const startIso = new Date(`${date}T${firstSlot.startTime}`).toISOString();
    let endObj = new Date(`${date}T${lastSlot.endTime}`);
    const startObj = new Date(`${date}T${firstSlot.startTime}`);
    if (endObj <= startObj) {
      endObj.setDate(endObj.getDate() + 1);
    }
    const endIso = endObj.toISOString();

    const tempMission: Mission = {
      id: initialData?.id || '',
      title,
      client,
      location,
      description,
      startTime: startIso,
      endTime: endIso,
      timeSlots: timeSlots.length > 1 ? timeSlots : undefined,
      status,
      rateType: 'day',
      hourlyRate: 0,
      totalEarnings: 0,
    };

    const conflicts = findDuplicateMissions(
      tempMission,
      missions,
      initialData?.id
    );

    if (conflicts.length > 0) {
      setDuplicateWarning(formatConflictMessage(conflicts));
    } else {
      setDuplicateWarning('');
    }
  }, [date, timeSlots, title, client, location, description, status, missions, initialData?.id]);

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
    setIsAddingNewClient(false);
    setNewClientName('');
  };

  // Handle adding new client
  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      setErrors(prev => ({ ...prev, newClient: 'Le nom du client est requis' }));
      return;
    }

    try {
      const newClient = await addClient(newClientName.trim());
      const updatedClients = await getAllClients(missions || []);
      setClients(updatedClients);
      setClient(newClient.name);
      setIsAddingNewClient(false);
      setNewClientName('');
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.newClient;
        return newErrors;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du client';
      setErrors(prev => ({ ...prev, newClient: message }));
    }
  };

  // Handle client selection change
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__new__') {
      setIsAddingNewClient(true);
      setClient('');
    } else {
      setClient(value);
      setIsAddingNewClient(false);
      setNewClientName('');
    }
    if (errors.client) {
      setErrors(prev => ({ ...prev, client: '' }));
    }
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
      if (model.timeSlots && model.timeSlots.length > 0) {
        setTimeSlots(model.timeSlots);
      } else {
        const start = new Date(model.startTime);
        const end = new Date(model.endTime);
        setTimeSlots([{ startTime: formatTimeForInput(start), endTime: formatTimeForInput(end) }]);
      }
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

    if (isAddingNewClient && !newClientName.trim()) {
      setErrors(prev => ({ ...prev, newClient: 'Veuillez ajouter le nouveau client ou annuler' }));
      return;
    }

    if (Object.keys(validateForm).length > 0) {
      setErrors(validateForm);
      return;
    }

    setErrors({});

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
      startTime: startIso,
      endTime: endIso,
      timeSlots: timeSlots,
      status: status,
      rateType: finalRateType,
      hourlyRate: calculationMode === 'auto' ? prefDayRate : 0,
      totalEarnings: finalTotal,
      details: {
        dayHours,
        nightHours
      },
      isPaid: initialData?.isPaid ?? false,
      paymentId: initialData?.paymentId,
      updatedAt: new Date().toISOString(),
    };

    onSave(newMission);
    onClose();
  };

  if (!isOpen) return null;

  const isConverting = initialData?.status === 'planned' && status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center backdrop-blur-sm bg-black/60 p-0 md:p-4 transition-all animate-fade-in">
      <div className="glass-elevated rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh] animate-slide-up-from-bottom md:animate-scale-in shadow-2xl border border-[var(--border-default)]">

        {/* Header — COMPACT */}
        <div className={`flex justify-between items-center px-4 py-3 md:px-5 md:py-3.5 border-b relative overflow-hidden ${isConverting ? 'bg-[var(--success-light)] border-[var(--success)]' : initialData?.isPaid ? 'bg-[var(--warning-light)] border-[var(--warning)]' : 'border-[var(--border-default)] bg-[var(--bg-elevated)]'}`}>
          {/* Handle bar for mobile */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-white/15 md:hidden" />

          <div className="relative z-10 min-w-0">
            <h2 className={`text-sm md:text-base font-extrabold tracking-tight ${isConverting ? 'text-[var(--success)]' : initialData?.isPaid ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}>
              {isConverting ? 'Valider les heures' : initialData?.isPaid ? 'Consulter la mission' : initialData ? 'Modifier la mission' : 'Nouvelle mission'}
            </h2>
            <p className={`text-[9px] md:text-[10px] mt-0.5 font-medium truncate ${isConverting ? 'text-[var(--success)]' : initialData?.isPaid ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'}`}>
              {isConverting ? 'Vérifiez les horaires réels.' : initialData?.isPaid ? 'Mission payée · Lecture seule' : 'Remplissez les détails'}
            </p>
          </div>
          <button onClick={onClose} className="relative z-10 p-1.5 hover:bg-[var(--bg-elevated)] rounded-[var(--radius-md)] transition-all text-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:scale-90">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-4 md:p-5 space-y-4 md:space-y-5">

            {/* Template Selector (Only on new mission) */}
            {!initialData && missions.length > 0 && (
              <div className="bg-[var(--primary)]/10 border border-[var(--primary)] rounded-[var(--radius-md)] p-2.5 flex items-center gap-2.5 hover:border-[var(--primary)] transition-all">
                <Copy size={13} className="text-[var(--primary)] shrink-0" strokeWidth={2.5} />
                <select
                  onChange={handleCopyFromMission}
                  className="bg-transparent text-[10px] text-[var(--primary)] font-semibold w-full focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Copier depuis une mission précédente...</option>
                  {missions.slice(-10).reverse().map(m => (
                    <option key={m.id} value={m.id} className="bg-[var(--bg-elevated)]">{m.title} - {m.client}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section 1: Informations Générales */}
            <section className="space-y-3">
              <h3 className="section-title flex items-center gap-1.5">
                <Briefcase size={11} className="text-[var(--primary)]" strokeWidth={2.5} /> Détails
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                    Titre
                    <Tooltip content="Nom descriptif de votre mission (ex: Régie Son, Accueil VIP)">
                      <AlertCircle size={9} className="text-[var(--text-tertiary)] cursor-help hover:text-[var(--primary)] transition-colors" />
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
                    disabled={initialData?.isPaid}
                    placeholder="Ex: Régie Son - Concert"
                    className={`w-full px-3 py-2 bg-[var(--bg-tertiary)] border rounded-[var(--radius-md)] outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors duration-[var(--dur-fast)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-medium ${errors.title ? 'border-[var(--danger)] ' : 'border-[var(--border-default)]'
                      } ${initialData?.isPaid ? 'opacity-50 cursor-not-allowed' : 'focus:border-[var(--primary)] '}`}
                  />
                  {errors.title && (
                    <p className="text-[9px] text-[var(--danger)] flex items-center gap-1">
                      <AlertCircle size={9} /> {errors.title}
                    </p>
                  )}
                </div>

                {/* Client */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                    Client
                    <Tooltip content="Sélectionnez un client existant ou ajoutez-en un nouveau">
                      <AlertCircle size={9} className="text-[var(--text-tertiary)] cursor-help" />
                    </Tooltip>
                  </label>

                  {!isAddingNewClient ? (
                    <select
                      value={client}
                      onChange={handleClientChange}
                      disabled={initialData?.isPaid}
                      className={`w-full px-3 py-2 bg-[var(--bg-tertiary)] border rounded-[var(--radius-md)] outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors duration-[var(--dur-fast)] text-xs text-[var(--text-primary)] ${errors.client ? 'border-[var(--danger)]' : 'border-[var(--border-default)]'
                        } ${initialData?.isPaid ? 'opacity-50 cursor-not-allowed' : 'focus:border-[var(--primary)]'}`}
                    >
                      <option value="">Sélectionner...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.name} className="bg-[var(--bg-elevated)]">
                          {c.name}
                        </option>
                      ))}
                      <option value="__new__" className="bg-[var(--primary)]/20 text-[var(--primary)]">
                        + Nouveau client
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newClientName}
                          onChange={(e) => {
                            setNewClientName(e.target.value);
                            if (errors.newClient) setErrors(prev => ({ ...prev, newClient: '' }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewClient();
                            } else if (e.key === 'Escape') {
                              setIsAddingNewClient(false);
                              setNewClientName('');
                            }
                          }}
                          placeholder="Nom du nouveau client"
                          autoFocus
                          className={`flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border rounded-[var(--radius-md)] outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors duration-[var(--dur-fast)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] ${errors.newClient ? 'border-[var(--danger)]' : 'border-[var(--border-default)] focus:border-[var(--primary)]'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddNewClient}
                          className="px-2 py-1.5 bg-[var(--primary)]/15 hover:bg-[var(--primary)]/25 text-[var(--primary)] border border-[var(--primary)] rounded-[var(--radius-md)] text-[9px] font-bold transition-all flex items-center gap-1"
                        >
                          <CheckCircle size={11} />
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewClient(false);
                            setNewClientName('');
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.newClient;
                              return newErrors;
                            });
                          }}
                          className="px-2 py-1.5 bg-[var(--bg-tertiary)] hover:bg-white/[0.04] text-[var(--text-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[9px] font-bold transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                      {errors.newClient && (
                        <p className="text-[9px] text-[var(--danger)] flex items-center gap-1">
                          <AlertCircle size={9} /> {errors.newClient}
                        </p>
                      )}
                    </div>
                  )}

                  {errors.client && (
                    <p className="text-[9px] text-[var(--danger)] flex items-center gap-1">
                      <AlertCircle size={9} /> {errors.client}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <MapPin size={9} className="text-[var(--text-tertiary)]" /> Lieu
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                  }}
                  disabled={initialData?.isPaid}
                  placeholder="Ex: Paris La Défense Arena"
                  className={`w-full px-3 py-2 bg-[var(--bg-tertiary)] border rounded-[var(--radius-md)] outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors duration-[var(--dur-fast)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] ${errors.location ? 'border-[var(--danger)]' : 'border-[var(--border-default)]'
                    } ${initialData?.isPaid ? 'opacity-50 cursor-not-allowed' : 'focus:border-[var(--primary)] '}`}
                />
                {errors.location && (
                  <p className="text-[9px] text-[var(--danger)] flex items-center gap-1">
                    <AlertCircle size={9} /> {errors.location}
                  </p>
                )}
              </div>
            </section>

            {/* Separator */}
            <div className="glass-separator" />

            {/* Section 2: Date & Horaires */}
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="section-title flex items-center gap-1.5">
                  <Calculator size={11} className="text-[var(--primary)]" /> Horaires & Calcul
                </h3>

                {/* Toggle Mode — DARK THEME */}
                <div className={`bg-[var(--bg-tertiary)] border border-[var(--border-default)] p-0.5 rounded-[var(--radius-md)] flex text-[9px] font-bold ${initialData?.isPaid ? 'opacity-40 pointer-events-none' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('auto')}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] transition-all ${calculationMode === 'auto' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('manual')}
                    className={`px-2.5 py-1 rounded-[var(--radius-sm)] transition-all ${calculationMode === 'manual' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                  >
                    Manuel
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                    }}
                    disabled={initialData?.isPaid}
                    className={`w-full px-3 py-2 bg-[var(--bg-tertiary)] border rounded-[var(--radius-md)] outline-none text-xs text-[var(--text-primary)] ${errors.date ? 'border-[var(--danger)]' : 'border-[var(--border-default)]'
                      } ${initialData?.isPaid ? 'opacity-50 cursor-not-allowed' : 'focus:border-[var(--primary)]'}`}
                    style={{ colorScheme: 'dark' }}
                  />
                  {errors.date && (
                    <p className="text-[9px] text-[var(--danger)] flex items-center gap-1">
                      <AlertCircle size={9} /> {errors.date}
                    </p>
                  )}
                </div>

                {/* Créneaux horaires multiples */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-[var(--text-secondary)]">Créneaux horaires</label>
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      disabled={initialData?.isPaid}
                      className="flex items-center gap-1 px-2 py-1 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)] rounded-[var(--radius-sm)] text-[9px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={10} />
                      Créneau
                    </button>
                  </div>

                  {timeSlots.map((slot, index) => (
                    <div key={index} className="group bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] p-2.5 border border-[var(--border-default)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Créneau {index + 1}</span>
                        {timeSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="p-1 hover:bg-[var(--danger-light)] text-[var(--danger)]/60 hover:text-[var(--danger)] rounded-[var(--radius-sm)] transition-all duration-[var(--dur-fast)] opacity-0 group-hover:opacity-100 active:scale-95"
                            title="Supprimer ce créneau"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[8px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Début</label>
                          <input
                            type="time"
                            required
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                            className={`w-full px-2.5 py-1.5 bg-[var(--bg-tertiary)] border rounded-[var(--radius-sm)] outline-none text-xs text-[var(--text-primary)] ${errors[`timeSlot_${index}_start`] ? 'border-[var(--danger)]' : 'border-[var(--border-default)] focus:border-[var(--primary)]'
                              }`}
                            style={{ colorScheme: 'dark' }}
                          />
                          {errors[`timeSlot_${index}_start`] && (
                            <p className="text-[8px] text-[var(--danger)] flex items-center gap-0.5">
                              <AlertCircle size={8} /> {errors[`timeSlot_${index}_start`]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Fin</label>
                          <input
                            type="time"
                            required
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                            className={`w-full px-2.5 py-1.5 bg-[var(--bg-tertiary)] border rounded-[var(--radius-sm)] outline-none text-xs text-[var(--text-primary)] ${errors[`timeSlot_${index}_end`] ? 'border-[var(--danger)]' : 'border-[var(--border-default)] focus:border-[var(--primary)]'
                              }`}
                            style={{ colorScheme: 'dark' }}
                          />
                          {errors[`timeSlot_${index}_end`] && (
                            <p className="text-[8px] text-[var(--danger)] flex items-center gap-0.5">
                              <AlertCircle size={8} /> {errors[`timeSlot_${index}_end`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {errors.timeSlots && (
                    <p className="text-[9px] text-[var(--danger)] flex items-center gap-1">
                      <AlertCircle size={9} /> {errors.timeSlots}
                    </p>
                  )}

                  {/* Avertissement de doublon */}
                  {duplicateWarning && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[var(--radius-md)] p-2.5 flex items-start gap-2">
                      <AlertCircle size={13} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-yellow-300/80 flex-1">{duplicateWarning}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Calculator Display — COMPACT & PRO */}
              <div className={`p-3 md:p-3.5 rounded-[var(--radius-md)] border transition-all relative overflow-hidden group ${status === 'completed' ? 'bg-[var(--success-light)] border-[var(--success)]' : 'bg-[var(--bg-elevated)] border-[var(--border-default)]'}`}>
                {/* Subtle shimmer on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                {calculationMode === 'auto' ? (
                  <div className="space-y-2.5 relative z-10">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-secondary)] block">Calcul Automatique</label>
                        <p className="text-[8px] text-[var(--text-tertiary)] mt-0.5">
                          {hidePrices ? 'Calcul jour/nuit' : `Jour ${prefDayRate}€/h · Nuit ${prefNightRate}€/h (>22h)`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-[var(--text-tertiary)] block uppercase tracking-wider font-bold">Total</span>
                        <span className={`text-xl md:text-2xl font-extrabold flex items-center justify-end gap-0.5 tracking-tight ${status === 'completed' ? 'text-[var(--success)]' : 'text-[var(--primary)]'}`}>
                          {formatPrice(computedTotal, 2)} {!hidePrices && <Euro size={16} strokeWidth={2.5} />}
                        </span>
                      </div>
                    </div>

                    {/* Visual Bar Breakdown */}
                    {(dayHours > 0 || nightHours > 0) && (
                      <div className="bg-white/[0.03] rounded-[var(--radius-md)] border border-[var(--border-default)] p-2.5">
                        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-[var(--bg-tertiary)] mb-2">
                          {dayHours > 0 && (
                            <div className="bg-amber-400/70 h-full transition-all" style={{ width: `${(dayHours / (dayHours + nightHours)) * 100}%` }} />
                          )}
                          {nightHours > 0 && (
                            <div className="bg-[var(--primary)]/70 h-full transition-all" style={{ width: `${(nightHours / (dayHours + nightHours)) * 100}%` }} />
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          {dayHours > 0 ? (
                            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                              <Sun size={11} className="text-amber-400" />
                              <span className="font-bold">{dayHours.toFixed(1)}h</span>
                              {!hidePrices && <span className="text-[var(--text-tertiary)] text-[9px]">× {RATE_DAY}€</span>}
                            </div>
                          ) : <span />}

                          {nightHours > 0 ? (
                            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                              <Moon size={11} className="text-[var(--primary)]" />
                              <span className="font-bold">{nightHours.toFixed(1)}h</span>
                              {!hidePrices && <span className="text-[var(--text-tertiary)] text-[9px]">× {RATE_NIGHT}€</span>}
                            </div>
                          ) : <span />}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Manual Mode
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] block">Montant Forfaitaire</label>
                      <p className="text-[8px] text-[var(--text-tertiary)] mt-0.5">Saisie manuelle</p>
                    </div>
                    <div className="w-2/5">
                      <div className="relative">
                        <input
                          type={hidePrices ? "password" : "number"}
                          min="0"
                          step="1"
                          value={hidePrices ? '' : manualTotal}
                          onChange={(e) => {
                            if (!hidePrices) {
                              setManualTotal(parseFloat(e.target.value) || 0);
                            }
                          }}
                          placeholder={hidePrices ? '•••' : undefined}
                          className="w-full pl-3 pr-8 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-right font-extrabold text-lg outline-none text-[var(--text-primary)] focus:border-[var(--primary)]"
                          disabled={hidePrices}
                        />
                        {!hidePrices && <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Separator */}
            <div className="glass-separator" />

            {/* Section 3: IA & Notes */}
            <section className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="section-title flex items-center gap-1.5">
                  <Sparkles size={11} className="text-[var(--primary)]" /> Notes
                </h3>
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancing || !description}
                  className="shimmer-btn text-[9px] flex items-center gap-1 border border-[var(--primary)] text-[var(--primary)] px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--primary-light)] font-bold transition-all duration-[var(--dur-fast)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles size={9} />
                  {isEnhancing ? 'IA...' : 'Reformuler'}
                </button>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes rapides : monté les spots, câblage régie..."
                rows={2}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] outline-none transition-all resize-none text-xs leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--primary)]"
              />
            </section>

            {/* Status Selector — COMPACT */}
            <div className="flex items-center gap-2.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] p-2 rounded-[var(--radius-md)]">
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] pl-1">Statut</span>
              <div className="flex gap-1.5 flex-1">
                {(['planned', 'completed', 'cancelled'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 px-2 py-1.5 text-[9px] rounded-[var(--radius-sm)] border transition-all capitalize font-bold ${status === s
                      ? s === 'completed' ? 'bg-[var(--success-light)] border-[var(--success)] text-[var(--success)]'
                        : s === 'cancelled' ? 'bg-[var(--danger-light)] border-[var(--danger)] text-[var(--danger)]'
                          : 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)]'
                      : 'bg-transparent border-[var(--border-default)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                      }`}
                  >
                    {s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions — COMPACT */}
          <div className="px-4 py-3 md:px-5 md:py-3.5 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] flex gap-2.5 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] font-bold transition-all duration-[var(--dur-fast)] text-[11px] tracking-wide active:scale-95"
            >
              Annuler
            </button>
            {!initialData?.isPaid ? (
              <button
                type="submit"
                className={`shimmer-btn flex-[2] text-white font-bold py-2.5 px-3 rounded-[var(--radius-md)] transition-all duration-[var(--dur-fast)] flex items-center justify-center gap-2 text-[11px] ${isConverting
                  ? 'bg-[var(--success)] hover:bg-[var(--success)] shadow-[var(--success-light)]'
                  : 'bg-gradient-to-r from-[var(--primary)] to-[#7c3aed] hover:shadow-lg hover:shadow-[var(--primary-glow)]'
                  }`}
              >
                <span className="flex items-center gap-1.5 tracking-wide">
                  {isConverting ? <CheckCircle size={14} strokeWidth={2.5} /> : <Calendar size={14} strokeWidth={2.5} />}
                  {isConverting ? 'Valider' : initialData ? 'Mettre à jour' : 'Enregistrer'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-[2] bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 px-3 rounded-[var(--radius-md)] shadow-md transition-all flex items-center justify-center gap-1.5 text-[11px] active:scale-[0.97]"
              >
                <CheckCircle size={14} strokeWidth={2.5} />
                <span className="tracking-wide">Fermer</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MissionForm;