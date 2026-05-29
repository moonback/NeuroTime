import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Mission, Payment } from '../types';
import { loadMissions, saveMissions, loadPayments, savePayment as savePaymentToStorage, deletePayment as deletePaymentFromStorage } from '../services/storageService';
import { useAuth } from './AuthContext';
import {
  saveMissionMutation,
  dbToMission,
  dbToPayment,
  deleteMissionMutation,
  getSupabaseClient,
} from '../services/supabaseService';
import { toast } from 'sonner';

interface MissionContextType {
  missions: Mission[];
  isLoading: boolean;
  isSaving: boolean;
  addMission: (mission: Mission) => void;
  updateMission: (mission: Mission) => void;
  deleteMission: (id: string) => void;
  refreshMissions: () => Promise<void>;
  importMissions: (importedMissions: Mission[]) => void;
  payments: Payment[];
  addPayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  refreshPayments: () => Promise<void>;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

type MissionDbInput = Parameters<typeof dbToMission>[0];
type PaymentDbInput = Parameters<typeof dbToPayment>[0];

function applyMissionEvent(
  current: Mission[],
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
): Mission[] {
  const { eventType } = payload;
  if (eventType === 'INSERT') {
    const newRecord = payload.new;
    const exists = current.find(m => m.id === newRecord.id);
    return exists ? current : [dbToMission(newRecord as MissionDbInput), ...current];
  }
  if (eventType === 'UPDATE') {
    const newRecord = payload.new;
    return current.map(m => m.id === newRecord.id ? dbToMission(newRecord as MissionDbInput) : m);
  }
  if (eventType === 'DELETE') {
    const oldRecord = payload.old;
    return current.filter(m => m.id !== oldRecord.id);
  }
  return current;
}

function applyPaymentEvent(
  current: Payment[],
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
): Payment[] {
  const { eventType } = payload;
  if (eventType === 'INSERT') {
    const newRecord = payload.new;
    const exists = current.find(p => p.id === newRecord.id);
    return exists ? current : [dbToPayment(newRecord as PaymentDbInput), ...current];
  }
  if (eventType === 'UPDATE') {
    const newRecord = payload.new;
    return current.map(p => p.id === newRecord.id ? dbToPayment(newRecord as PaymentDbInput) : p);
  }
  if (eventType === 'DELETE') {
    const oldRecord = payload.old;
    return current.filter(p => p.id !== oldRecord.id);
  }
  return current;
}

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setMissions([]);
      setPayments([]);
      return;
    }

    setIsLoading(true);
    try {
      const [missionsData, paymentsData] = await Promise.all([
        loadMissions(user.id),
        loadPayments(user.id)
      ]);
      setMissions(missionsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const missionsChannel = supabase
      .channel(`missions:user:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'missions', filter: `user_id=eq.${user.id}` },
        (payload) => setMissions(current => applyMissionEvent(current, payload))
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel(`payments:user:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
        (payload) => setPayments(current => applyPaymentEvent(current, payload))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(missionsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [user?.id]);

  const addMission = useCallback((mission: Mission) => {
    if (!user?.id) return;
    const newMission: Mission = {
      ...mission,
      id: mission.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    setMissions(prev => [newMission, ...prev]);
    saveMissions(user.id, [newMission, ...missions]).catch(console.error);

    saveMissionMutation(newMission)
      .then(saved => {
        setMissions(prev => prev.map(m => m.id === saved.id ? saved : m));
        toast.success('Mission ajoutée');
      })
      .catch(error => {
        setMissions(prev => prev.filter(m => m.id !== newMission.id));
        console.error('Erreur lors de la création distante:', error);
        toast.error('Échec de la création, modification annulée');
      })
      .finally(() => setIsSaving(false));
  }, [missions, user?.id]);

  const updateMission = useCallback((mission: Mission) => {
    if (!user?.id) return;
    const previous = missions.find(m => m.id === mission.id);
    const updated: Mission = { ...mission, updatedAt: new Date().toISOString() };

    setIsSaving(true);
    setMissions(prev => {
      const next = prev.map(m => m.id === mission.id ? updated : m);
      saveMissions(user.id, next).catch(console.error);
      return next;
    });

    saveMissionMutation(updated)
      .then(saved => {
        setMissions(prev => prev.map(m => m.id === saved.id ? saved : m));
        toast.success('Mission mise à jour');
      })
      .catch(error => {
        if (previous) setMissions(prev => prev.map(m => m.id === mission.id ? previous : m));
        console.error('Erreur lors de la mise à jour distante:', error);
        toast.error('Échec de la mise à jour, modification annulée');
      })
      .finally(() => setIsSaving(false));
  }, [missions, user?.id]);

  const deleteMission = useCallback((id: string) => {
    if (!user?.id) return;
    const previous = missions.find(m => m.id === id);

    setIsSaving(true);
    setMissions(prev => {
      const next = prev.filter(m => m.id !== id);
      saveMissions(user.id, next).catch(console.error);
      return next;
    });

    deleteMissionMutation(id)
      .then(() => toast.success('Mission supprimée'))
      .catch(error => {
        if (previous) setMissions(prev => [previous, ...prev]);
        console.error('Erreur lors de la suppression distante:', error);
        toast.error('Échec de la suppression, modification annulée');
      })
      .finally(() => setIsSaving(false));
  }, [missions, user?.id]);

  const importMissions = useCallback((importedMissions: Mission[]) => {
    const now = new Date().toISOString();
    const missionsWithTimestamp = importedMissions.map(mission => ({
      ...mission,
      updatedAt: mission.updatedAt || now,
    }));
    setMissions(missionsWithTimestamp);
    Promise.all(missionsWithTimestamp.map(saveMissionMutation)).catch(error => {
      console.error("Erreur lors de la synchronisation de l'import:", error);
      toast.error('Import local effectué, synchronisation distante en échec');
    });
    toast.success(`${importedMissions.length} missions importées`);
  }, []);

  const addPayment = useCallback(async (payment: Payment) => {
    try {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      await savePaymentToStorage(user.id, payment);
      setPayments(prev => [payment, ...prev.filter(p => p.id !== payment.id)]);

      const now = new Date().toISOString();
      setMissions(prev => prev.map(m =>
        payment.missionIds.includes(m.id)
          ? { ...m, isPaid: true, paymentId: payment.id, updatedAt: now }
          : m
      ));

      toast.success('Paiement enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  }, [user?.id]);

  const deletePayment = useCallback(async (id: string) => {
    try {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      await deletePaymentFromStorage(user.id, id);
      setPayments(prev => prev.filter(p => p.id !== id));

      const now = new Date().toISOString();
      setMissions(prev => prev.map(m =>
        m.paymentId === id
          ? { ...m, isPaid: false, paymentId: undefined, updatedAt: now }
          : m
      ));

      toast.success('Paiement supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du paiement:', error);
      toast.error('Erreur lors de la suppression du paiement');
    }
  }, [user?.id]);

  const contextValue = useMemo(() => ({
    missions,
    isLoading,
    isSaving,
    addMission,
    updateMission,
    deleteMission,
    refreshMissions: loadData,
    importMissions,
    payments,
    addPayment,
    deletePayment,
    refreshPayments: loadData,
  }), [
    missions,
    isLoading,
    isSaving,
    addMission,
    updateMission,
    deleteMission,
    loadData,
    importMissions,
    payments,
    addPayment,
    deletePayment,
  ]);

  return (
    <MissionContext.Provider value={contextValue}>
      {children}
    </MissionContext.Provider>
  );
};

export const useMissions = () => {
  const context = useContext(MissionContext);
  if (context === undefined) {
    throw new Error('useMissions must be used within a MissionProvider');
  }
  return context;
};
