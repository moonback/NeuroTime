import { addMinutes } from 'date-fns';

export const RATE_DAY = 20;
export const RATE_NIGHT = 25;
export const NIGHT_START_HOUR = 22; // 22h
export const NIGHT_END_HOUR = 7;    // 7h

export interface PriceDetails {
  dayHours: number;
  nightHours: number;
  total: number;
  rateType: 'day' | 'night' | 'mixed';
}

// Calculer les gains pour un seul créneau horaire
export const calculateEarnings = (dateStr: string, startTime: string, endTime: string): PriceDetails => {
  // Vérifier que les paramètres sont valides avant de créer les dates
  if (!dateStr || !startTime || !endTime) {
    throw new Error(`Dates ou heures invalides: date="${dateStr}", début="${startTime}", fin="${endTime}"`);
  }
  
  if (dateStr.trim() === '' || startTime.trim() === '' || endTime.trim() === '') {
    throw new Error(`Dates ou heures invalides: date="${dateStr}", début="${startTime}", fin="${endTime}"`);
  }
  
  // Utiliser le fuseau horaire local du navigateur
  // Format: YYYY-MM-DD pour dateStr, HH:mm pour les heures
  const start = new Date(`${dateStr}T${startTime}`);
  let end = new Date(`${dateStr}T${endTime}`);
  
  // Si l'heure de fin est avant ou égale à l'heure de début, c'est le lendemain
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  
  // Vérifier que les dates sont valides
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error(`Dates ou heures invalides: date="${dateStr}", début="${startTime}", fin="${endTime}"`);
  }

  let current = new Date(start);
  let dMins = 0;
  let nMins = 0;

  // Itération minute par minute pour la précision
  while (current < end) {
    const h = current.getHours();
    // La nuit est entre 22h00 (inclus) et 07h00 (exclus)
    const isNight = h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR;
    
    if (isNight) {
      nMins++;
    } else {
      dMins++;
    }
    current = addMinutes(current, 1);
  }

  const dayHours = dMins / 60;
  const nightHours = nMins / 60;

  const total = (dayHours * RATE_DAY) + (nightHours * RATE_NIGHT);
  
  let rateType: 'day' | 'night' | 'mixed' = 'day';
  if (dayHours > 0 && nightHours > 0) rateType = 'mixed';
  else if (nightHours > 0) rateType = 'night';

  return {
    dayHours,
    nightHours,
    total: Math.round(total * 100) / 100,
    rateType
  };
};

// Calculer les gains pour plusieurs créneaux horaires
export const calculateEarningsMultiple = (dateStr: string, timeSlots: { startTime: string; endTime: string }[]): PriceDetails => {
  // Vérifier que la date est valide
  if (!dateStr || dateStr.trim() === '') {
    throw new Error('Date invalide pour le calcul des gains');
  }
  
  // Vérifier qu'il y a au moins un créneau
  if (!timeSlots || timeSlots.length === 0) {
    throw new Error('Aucun créneau horaire fourni pour le calcul');
  }
  
  let totalDayHours = 0;
  let totalNightHours = 0;
  
  // Calculer pour chaque créneau (ignorer les créneaux invalides)
  for (const slot of timeSlots) {
    // Vérifier que le créneau a des valeurs valides
    if (!slot || !slot.startTime || !slot.endTime || 
        slot.startTime.trim() === '' || slot.endTime.trim() === '') {
      console.warn('Créneau horaire ignoré (valeurs manquantes):', slot);
      continue;
    }
    
    try {
      const slotResult = calculateEarnings(dateStr, slot.startTime, slot.endTime);
      totalDayHours += slotResult.dayHours;
      totalNightHours += slotResult.nightHours;
    } catch (error) {
      console.error('Erreur lors du calcul pour un créneau:', slot, error);
      throw error; // Propager l'erreur pour que l'appelant puisse la gérer
    }
  }
  
  const total = (totalDayHours * RATE_DAY) + (totalNightHours * RATE_NIGHT);
  
  let rateType: 'day' | 'night' | 'mixed' = 'day';
  if (totalDayHours > 0 && totalNightHours > 0) rateType = 'mixed';
  else if (totalNightHours > 0) rateType = 'night';
  
  return {
    dayHours: Math.round(totalDayHours * 100) / 100,
    nightHours: Math.round(totalNightHours * 100) / 100,
    total: Math.round(total * 100) / 100,
    rateType
  };
};