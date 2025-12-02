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

export type ViewState = 'dashboard' | 'calendar' | 'missions' | 'finance';

export interface DayStats {
  date: string;
  hours: number;
  count: number;
  earnings: number;
}

// Types pour la gestion financière
export interface Invoice {
  id: string;
  invoiceNumber: string;
  missionId: string;
  client: string;
  clientAddress?: string;
  clientEmail?: string;
  issueDate: string; // ISO String
  dueDate: string; // ISO String
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number; // Pourcentage (ex: 20 pour 20%)
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  missionId?: string; // Optionnel si créé sans mission
  client: string;
  clientAddress?: string;
  clientEmail?: string;
  issueDate: string; // ISO String
  validUntil: string; // ISO String
  items: QuoteItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string; // ISO String
  method: 'cash' | 'bank_transfer' | 'check' | 'card' | 'other';
  reference?: string; // Numéro de chèque, référence virement, etc.
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReport {
  period: 'month' | 'year';
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  missionCount: number;
  invoiceCount: number;
  averageInvoiceAmount: number;
  breakdown: {
    byClient: { client: string; amount: number; count: number }[];
    byMonth?: { month: string; amount: number; count: number }[];
  };
}