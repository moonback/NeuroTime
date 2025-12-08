import { Mission, TimeSlot } from '../types';
import { format, parse } from 'date-fns';

/**
 * Vérifie si deux créneaux horaires se chevauchent
 */
const doTimeSlotsOverlap = (
  slot1: TimeSlot,
  slot2: TimeSlot,
  date1: string,
  date2: string
): boolean => {
  // Si les dates sont différentes, pas de chevauchement
  if (date1 !== date2) {
    return false;
  }

  // Convertir les créneaux en dates pour comparaison
  const start1 = parse(`${date1} ${slot1.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  let end1 = parse(`${date1} ${slot1.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
  if (end1 <= start1) {
    end1 = new Date(end1.getTime() + 24 * 60 * 60 * 1000); // Ajouter 24h si fin < début
  }

  const start2 = parse(`${date2} ${slot2.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  let end2 = parse(`${date2} ${slot2.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
  if (end2 <= start2) {
    end2 = new Date(end2.getTime() + 24 * 60 * 60 * 1000);
  }

  // Vérifier le chevauchement : slot1 commence avant la fin de slot2 ET slot1 finit après le début de slot2
  return start1 < end2 && end1 > start2;
};

/**
 * Extrait les créneaux horaires d'une mission (compatibilité avec anciennes missions)
 */
const getMissionTimeSlots = (mission: Mission, date: string): TimeSlot[] => {
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
 * Extrait la date d'une mission (format YYYY-MM-DD)
 */
const getMissionDate = (mission: Mission): string => {
  const start = new Date(mission.startTime);
  return format(start, 'yyyy-MM-dd');
};

/**
 * Vérifie si une mission entre en conflit avec d'autres missions (même date/heure)
 * 
 * @param newMission - La mission à vérifier
 * @param existingMissions - Liste des missions existantes
 * @param excludeMissionId - ID de mission à exclure de la vérification (pour les mises à jour)
 * @returns Liste des missions en conflit
 */
export const findDuplicateMissions = (
  newMission: Mission,
  existingMissions: Mission[],
  excludeMissionId?: string
): Mission[] => {
  const newDate = getMissionDate(newMission);
  const newTimeSlots = getMissionTimeSlots(newMission, newDate);
  
  const conflicts: Mission[] = [];
  
  for (const existingMission of existingMissions) {
    // Exclure la mission en cours de modification
    if (excludeMissionId && existingMission.id === excludeMissionId) {
      continue;
    }
    
    const existingDate = getMissionDate(existingMission);
    const existingTimeSlots = getMissionTimeSlots(existingMission, existingDate);
    
    // Vérifier si les dates sont identiques
    if (newDate !== existingDate) {
      continue;
    }
    
    // Vérifier si au moins un créneau se chevauche
    for (const newSlot of newTimeSlots) {
      for (const existingSlot of existingTimeSlots) {
        if (doTimeSlotsOverlap(newSlot, existingSlot, newDate, existingDate)) {
          conflicts.push(existingMission);
          break; // Pas besoin de vérifier les autres créneaux de cette mission
        }
      }
      if (conflicts.includes(existingMission)) {
        break; // Mission déjà marquée comme conflit
      }
    }
  }
  
  return conflicts;
};

/**
 * Formate un message d'avertissement pour les missions en conflit
 */
export const formatConflictMessage = (conflicts: Mission[]): string => {
  if (conflicts.length === 0) {
    return '';
  }
  
  if (conflicts.length === 1) {
    const conflict = conflicts[0];
    return `Attention : Une mission existe déjà à cette date/heure : "${conflict.title}" (${conflict.client})`;
  }
  
  return `Attention : ${conflicts.length} missions existent déjà à cette date/heure`;
};

