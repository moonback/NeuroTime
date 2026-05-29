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

  // Suivi du paiement
  isPaid?: boolean; // Indique si la mission a été payée

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

  // Timestamps (optionnels pour compatibilité avec anciennes missions)
  updatedAt?: string; // ISO String - Date de dernière modification

  // Liaison avec un virement/paiement groupé
  paymentId?: string; // ID du virement correspondant
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  client: string;
  description?: string;
  reference?: string;
  missionIds: string[];
  method: 'virement' | 'cash' | 'check' | 'other';
  createdAt: string;
}

export type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Error | { message: string } };

export type ViewState = 'dashboard' | 'calendar' | 'missions' | 'payments';

export interface DayStats {
  date: string;
  hours: number;
  count: number;
  earnings: number;
}

// Types liés à la facturation supprimés avec la vue Finance