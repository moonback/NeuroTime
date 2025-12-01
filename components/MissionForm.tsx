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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-100">
        
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${isConverting ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isConverting ? 'text-green-800' : 'text-gray-800'}`}>
              {isConverting ? 'Valider les heures' : initialData ? 'Modifier la mission' : 'Nouvelle mission'}
            </h2>
            <p className={`text-xs mt-0.5 ${isConverting ? 'text-green-600' : 'text-gray-500'}`}>
              {isConverting ? 'Vérifiez les horaires réels pour finaliser le montant.' : 'Remplissez les détails pour votre suivi.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            
            {/* Template Selector (Only on new mission) */}
            {!initialData && missions.length > 0 && (
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                 <Copy size={16} className="text-blue-500" />
                 <select 
                   onChange={handleCopyFromMission}
                   className="bg-transparent text-sm text-blue-700 font-medium w-full focus:outline-none cursor-pointer"
                   defaultValue=""
                 >
                   <option value="" disabled>Copier depuis une mission précédente...</option>
                   {missions.slice(-10).reverse().map(m => (
                     <option key={m.id} value={m.id}>{m.title} - {m.client}</option>
                   ))}
                 </select>
               </div>
            )}

            {/* Section 1: Informations Générales */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={14} /> Détails de la mission
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Titre de la mission</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Régie Son - Concert"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Client</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Ex: Event Pro Agency"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" /> Lieu
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Paris La Défense Arena"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Section 2: Date & Horaires */}
            <section className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Calculator size={14} /> Horaires & Calcul
                </h3>
                
                {/* Toggle Mode */}
                <div className="bg-gray-100 p-0.5 rounded-lg flex text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setCalculationMode('auto')}
                    className={`px-3 py-1 rounded-md transition-all ${calculationMode === 'auto' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('manual')}
                    className={`px-3 py-1 rounded-md transition-all ${calculationMode === 'manual' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Manuel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Début</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none ${isConverting ? 'border-orange-300 bg-orange-50 font-bold text-gray-900' : 'border-gray-200'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fin</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                     className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none ${isConverting ? 'border-orange-300 bg-orange-50 font-bold text-gray-900' : 'border-gray-200'}`}
                  />
                </div>
              </div>

              {/* Smart Calculator Display */}
              <div className={`p-5 rounded-2xl border transition-all ${status === 'completed' ? 'bg-green-50/50 border-green-200' : 'bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200'}`}>
                
                {calculationMode === 'auto' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                         <label className="text-sm font-bold text-slate-700 block mb-1">Calcul Automatique</label>
                         <p className="text-xs text-slate-500">Basé sur jour ({RATE_DAY}€) et nuit ({RATE_NIGHT}€ {'>'} 22h)</p>
                       </div>
                       <div className="text-right">
                          <span className="text-xs text-gray-500 block mb-1 uppercase tracking-wide">Total Estimé</span>
                          <span className={`text-3xl font-bold flex items-center justify-end gap-1 ${status === 'completed' ? 'text-green-700' : 'text-primary-700'}`}>
                            {computedTotal.toFixed(2)} <Euro size={24} strokeWidth={2.5} />
                          </span>
                       </div>
                    </div>

                    {/* Visual Bar Breakdown */}
                    {(dayHours > 0 || nightHours > 0) && (
                      <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 mb-3">
                          {dayHours > 0 && (
                            <div className="bg-orange-400 h-full" style={{ width: `${(dayHours / (dayHours + nightHours)) * 100}%` }} />
                          )}
                           {nightHours > 0 && (
                            <div className="bg-indigo-600 h-full" style={{ width: `${(nightHours / (dayHours + nightHours)) * 100}%` }} />
                          )}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          {dayHours > 0 ? (
                             <div className="flex items-center gap-2 text-slate-700">
                               <Sun size={16} className="text-orange-500" />
                               <span className="font-semibold">{dayHours.toFixed(1)}h</span>
                               <span className="text-slate-400">× {RATE_DAY}€</span>
                             </div>
                          ) : <span />}
                          
                          {nightHours > 0 ? (
                             <div className="flex items-center gap-2 text-slate-700">
                               <Moon size={16} className="text-indigo-600" />
                               <span className="font-semibold">{nightHours.toFixed(1)}h</span>
                               <span className="text-slate-400">× {RATE_NIGHT}€</span>
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
                        <label className="text-sm font-bold text-slate-700 block mb-1">Montant Forfaitaire</label>
                         <p className="text-xs text-slate-500">Saisie manuelle du total</p>
                     </div>
                     <div className="w-1/2">
                       <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={manualTotal}
                          onChange={(e) => setManualTotal(parseFloat(e.target.value))}
                          className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-right font-bold text-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <Euro className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-fade-in space-y-4">
                   {/* Delivery */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Livraison / Install
                     </div>
                     <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      />
                      <input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      />
                   </div>

                   <div className="border-t border-slate-200"></div>

                   {/* Pickup */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div> Reprise / Démontage
                     </div>
                     <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      />
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                />
              </div>
            </section>

            {/* Status Selector */}
             <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl">
               <span className="text-sm font-medium text-gray-700 pl-2">Statut :</span>
               <div className="flex gap-2">
                 {(['planned', 'completed', 'cancelled'] as const).map(s => (
                   <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all capitalize ${
                      status === s 
                      ? s === 'completed' ? 'bg-green-100 border-green-200 text-green-700 font-bold' 
                        : s === 'cancelled' ? 'bg-red-100 border-red-200 text-red-700 font-bold'
                        : 'bg-blue-100 border-blue-200 text-blue-700 font-bold'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                   >
                     {s === 'planned' ? 'Planifié' : s === 'completed' ? 'Terminé' : 'Annulé'}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-white hover:shadow-sm transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`flex-[2] bg-gradient-to-r text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 ${
                isConverting 
                ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-500/30' 
                : 'from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-primary-500/30'
              }`}
            >
               {isConverting ? <CheckCircle size={18} /> : <Calendar size={18} />}
              {isConverting ? 'Valider les heures' : initialData ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MissionForm;