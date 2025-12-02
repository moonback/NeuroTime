export interface TimeSlot {
  startTime: string; // Format HH:mm
  endTime: string; // Format HH:mm
}

export interface Mission {
  id: string;
  title: string;
  client: string;
  location: string;
  description: string;
  startTime: string; // ISO String (pour compatibilité, correspond au premier créneau)
  endTime: string; // ISO String (pour compatibilité, correspond au dernier créneau)
  status: 'planned' | 'completed' | 'cancelled';
  
  // Créneaux horaires multiples (nouveau)
  timeSlots?: TimeSlot[]; // Tableau de créneaux horaires pour la même journée
  
  // Nouveaux champs financiers
  rateType: 'day' | 'night' | 'mixed' | 'custom';
  hourlyRate: number; // Taux de base (indicatif si mixte)
  totalEarnings: number;
  
  // Détail du calcul automatique
  details?: {
    dayHours: number;
    nightHours: number;
  };

  // Champs logistiques
  logistics?: {
    deliveryTime?: string; // ISO String
    pickupTime?: string; // ISO String
  };
}

export type ViewState = 'dashboard' | 'calendar' | 'missions';

export interface DayStats {
  date: string;
  hours: number;
  count: number;
  earnings: number;
}