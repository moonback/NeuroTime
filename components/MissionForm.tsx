import React, { useState, useEffect } from 'react';
import { Mission } from '../types';
import { X, Sparkles, MapPin, Calculator, Calendar, Briefcase, Euro, Moon, Sun, CheckCircle, Truck, ArrowRight, Copy } from 'lucide-react';
import { enhanceDescription } from '../services/geminiService';
import { calculateEarnings, RATE_DAY, RATE_NIGHT } from '../utils/calculations';

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
  
  // Time fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  
  // Logistics fields
  const [showLogistics, setShowLogistics] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  // Financial fields
  const [calculationMode, setCalculationMode] = useState<'auto' | 'manual'>('auto');
  const [manualTotal, setManualTotal] = useState<number>(0);
  
  // Computed state
  const [computedTotal, setComputedTotal] = useState<number>(0);
  const [dayHours, setDayHours] = useState<number>(0);
  const [nightHours, setNightHours] = useState<number>(0);
  
  const [status, setStatus] = useState<'planned' | 'completed' | 'cancelled'>('planned');
  const [isEnhancing, setIsEnhancing] = useState(false);

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
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      
      setStatus(initialData.status);

      // Logistics init
      if (initialData.logistics?.deliveryTime || initialData.logistics?.pickupTime) {
        setShowLogistics(true);
        if (initialData.logistics.deliveryTime) {
          const d = new Date(initialData.logistics.deliveryTime);
          setDeliveryDate(formatDateForInput(d));
          setDeliveryTime(formatTimeForInput(d));
        }
        if (initialData.logistics.pickupTime) {
          const p = new Date(initialData.logistics.pickupTime);
          setPickupDate(formatDateForInput(p));
          setPickupTime(formatTimeForInput(p));
        }
      } else {
        setShowLogistics(false);
        setDeliveryDate('');
        setDeliveryTime('');
        setPickupDate('');
        setPickupTime('');
      }

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

  // Sync Logistics Default Dates when Main Date changes
  useEffect(() => {
    if (!initialData && !deliveryDate) setDeliveryDate(date);
    if (!initialData && !pickupDate) {
        // Default pickup next day or same day? Let's say same day initially
        setPickupDate(date);
    }
  }, [date, initialData, deliveryDate, pickupDate]);

  // Auto-calculate logic
  useEffect(() => {
    if (calculationMode === 'auto') {
      const result = calculateEarnings(date, startTime, endTime);
      setDayHours(result.dayHours);
      setNightHours(result.nightHours);
      setComputedTotal(result.total);
    }
  }, [startTime, endTime, date, calculationMode]);

  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];
  const formatTimeForInput = (d: Date) => d.toTimeString().slice(0, 5);

  const resetForm = () => {
    setTitle('');
    setClient('');
    setLocation('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('14:00');
    setEndTime('23:00');
    setStatus('planned');
    setCalculationMode('auto');
    setManualTotal(0);
    setShowLogistics(false);
    setDeliveryDate('');
    setDeliveryTime('');
    setPickupDate('');
    setPickupTime('');
  };

  const handleCopyFromMission = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const missionId = e.target.value;
    const model = missions.find(m => m.id === missionId);
    if (model) {
      setTitle(model.title);
      setClient(model.client);
      setLocation(model.location);
      // We keep the current date, but copy the times
      const start = new Date(model.startTime);
      const end = new Date(model.endTime);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      
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
    const startIso = new Date(`${date}T${startTime}`).toISOString();
    let endObj = new Date(`${date}T${endTime}`);
    const startObj = new Date(`${date}T${startTime}`);
    
    if (endObj <= startObj) {
      endObj.setDate(endObj.getDate() + 1);
    }
    const endIso = endObj.toISOString();

    // Handle Logistics
    let logistics = undefined;
    if (showLogistics) {
      logistics = {
        deliveryTime: (deliveryDate && deliveryTime) ? new Date(`${deliveryDate}T${deliveryTime}`).toISOString() : undefined,
        pickupTime: (pickupDate && pickupTime) ? new Date(`${pickupDate}T${pickupTime}`).toISOString() : undefined
      };
    }

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
      status: status,
      rateType: finalRateType,
      hourlyRate: calculationMode === 'auto' ? RATE_DAY : 0, 
      totalEarnings: finalTotal,
      details: {
        dayHours,
        nightHours
      },
      logistics
    };

    onSave(newMission);
    onClose();
  };

  if (!isOpen) return null;

  const isConverting = initialData?.status === 'planned' && status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 transition-all">
      <div className="bg-dark-50 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] border border-dark-100">
        
        {/* Header */}
        <div className={`flex justify-between items-center p-4 md:p-6 border-b ${isConverting ? 'bg-green-500/20 border-green-500/30' : 'bg-dark-100 border-dark-200'}`}>
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
                  <label className="text-xs md:text-sm font-medium text-gray-700">Titre de la mission</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Régie Son - Concert"
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-gray-200">Client</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Ex: Event Pro Agency"
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1">
                  <MapPin size={12} className="text-gray-500" /> Lieu
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Paris La Défense Arena"
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
                />
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-gray-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-gray-200">Début</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-gray-100 ${isConverting ? 'border-orange-500/50 bg-orange-500/20 font-bold' : 'border-dark-200'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-medium text-gray-200">Fin</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                     className={`w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm text-gray-100 ${isConverting ? 'border-orange-500/50 bg-orange-500/20 font-bold' : 'border-dark-200'}`}
                  />
                </div>
              </div>

              {/* Smart Calculator Display */}
              <div className={`p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all ${status === 'completed' ? 'bg-green-500/20 border-green-500/30' : 'bg-gradient-to-br from-dark-100 to-primary-500/10 border-dark-200'}`}>
                
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
                      <div className="bg-dark-50 rounded-xl border border-dark-200 p-3 shadow-sm">
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
                          className="w-full pl-4 pr-10 py-3 bg-dark-100 border border-dark-200 rounded-xl text-right font-bold text-xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-100"
                        />
                        <Euro className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                       </div>
                     </div>
                   </div>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />
            
            {/* LOGISTICS SECTION */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Truck size={14} /> Logistique
                </h3>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showLogistics} 
                    onChange={(e) => setShowLogistics(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                  />
                  <span>Horaires spéciaux (Livraison/Reprise)</span>
                </label>
              </div>

              {showLogistics && (
                <div className="bg-dark-100 rounded-xl p-4 border border-dark-200 animate-fade-in space-y-4">
                   {/* Delivery */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center gap-2 text-sm font-medium text-gray-200 md:col-span-2">
                        <div className="w-2 h-2 rounded-full bg-primary-400"></div> Livraison / Install
                     </div>
                     <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-50 border border-dark-200 rounded-lg text-sm text-gray-100"
                      />
                      <input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-50 border border-dark-200 rounded-lg text-sm text-gray-100"
                      />
                   </div>

                   <div className="border-t border-dark-200"></div>

                   {/* Pickup */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center gap-2 text-sm font-medium text-gray-200 md:col-span-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div> Reprise / Démontage
                     </div>
                     <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-50 border border-dark-200 rounded-lg text-sm text-gray-100"
                      />
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-50 border border-dark-200 rounded-lg text-sm text-gray-100"
                      />
                   </div>
                </div>
              )}
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
                  className="w-full px-4 py-3 bg-dark-100 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed text-gray-100 placeholder-gray-500"
                />
              </div>
            </section>

            {/* Status Selector */}
             <div className="flex gap-4 items-center bg-dark-100 p-3 rounded-xl border border-dark-200">
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
                      : 'bg-dark-50 border-dark-200 text-gray-400 hover:bg-dark-200 hover:text-gray-200'
                    }`}
                   >
                     {s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 md:p-6 border-t border-dark-200 bg-dark-100 flex gap-3 md:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl border border-dark-200 text-gray-200 font-semibold hover:bg-dark-200 hover:shadow-sm transition-all text-sm md:text-base"
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