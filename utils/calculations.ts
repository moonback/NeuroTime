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

export const calculateEarnings = (dateStr: string, startTime: string, endTime: string): PriceDetails => {
  const start = new Date(`${dateStr}T${startTime}`);
  let end = new Date(`${dateStr}T${endTime}`);
  
  // Si l'heure de fin est avant ou égale à l'heure de début, c'est le lendemain
  if (end <= start) {
    end.setDate(end.getDate() + 1);
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