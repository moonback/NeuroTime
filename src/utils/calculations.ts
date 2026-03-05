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

/**
 * Calculer les gains pour un seul créneau horaire
 */
export const calculateEarnings = (
  dateStr: string,
  startTime: string,
  endTime: string,
  dayRate: number = RATE_DAY,
  nightRate: number = RATE_NIGHT
): PriceDetails => {
  if (!dateStr || !startTime || !endTime) {
    throw new Error(`Dates ou heures invalides: date="${dateStr}", début="${startTime}", fin="${endTime}"`);
  }

  const start = new Date(`${dateStr}T${startTime}`);
  let end = new Date(`${dateStr}T${endTime}`);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error(`Dates ou heures invalides: date="${dateStr}", début="${startTime}", fin="${endTime}"`);
  }

  let current = new Date(start);
  let dMins = 0;
  let nMins = 0;

  while (current < end) {
    const h = current.getHours();
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
  const total = (dayHours * dayRate) + (nightHours * nightRate);

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

/**
 * Calculer les gains pour plusieurs créneaux horaires
 */
export const calculateEarningsMultiple = (
  dateStr: string,
  timeSlots: { startTime: string; endTime: string }[],
  dayRate: number = RATE_DAY,
  nightRate: number = RATE_NIGHT
): PriceDetails => {
  if (!dateStr || dateStr.trim() === '') {
    throw new Error('Date invalide pour le calcul des gains');
  }

  if (!timeSlots || timeSlots.length === 0) {
    throw new Error('Aucun créneau horaire fourni pour le calcul');
  }

  let totalDayHours = 0;
  let totalNightHours = 0;

  for (const slot of timeSlots) {
    if (!slot || !slot.startTime || !slot.endTime) continue;

    try {
      const slotResult = calculateEarnings(dateStr, slot.startTime, slot.endTime, dayRate, nightRate);
      totalDayHours += slotResult.dayHours;
      totalNightHours += slotResult.nightHours;
    } catch (error) {
      console.error('Erreur lors du calcul pour un créneau:', slot, error);
      throw error;
    }
  }

  const total = (totalDayHours * dayRate) + (totalNightHours * nightRate);

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