import { Mission, TimeSlot } from '../types';
import { format } from 'date-fns';

/**
 * Récupère les créneaux horaires d'une mission (compatibilité avec anciennes missions)
 */
export const getMissionTimeSlots = (mission: Mission): TimeSlot[] => {
  if (mission.timeSlots && mission.timeSlots.length > 0) {
    return mission.timeSlots;
  }
  
  // Compatibilité avec les anciennes missions (un seul créneau)
  const start = new Date(mission.startTime);
  const end = new Date(mission.endTime);
  
  return [{
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm')
  }];
};

/**
 * Formate l'affichage des créneaux horaires
 */
export const formatTimeSlots = (mission: Mission): string => {
  const slots = getMissionTimeSlots(mission);
  
  if (slots.length === 1) {
    return `${slots[0].startTime} - ${slots[0].endTime}`;
  }
  
  // Plusieurs créneaux : afficher le premier et le dernier, ou tous si peu nombreux
  if (slots.length <= 3) {
    return slots.map(s => `${s.startTime}-${s.endTime}`).join(', ');
  }
  
  // Beaucoup de créneaux : afficher le premier, "..." et le dernier
  return `${slots[0].startTime}-${slots[0].endTime}, ..., ${slots[slots.length - 1].startTime}-${slots[slots.length - 1].endTime}`;
};

