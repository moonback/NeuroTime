import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Mission, Payment } from '../types';
import { loadMissions, saveMissions, loadPayments, savePayment as savePaymentToStorage, deletePayment as deletePaymentFromStorage } from '../services/storageService';
import { useAuth } from './AuthContext';
import {
  addMissionToSupabase,
  dbToMission,
  dbToPayment,
  deleteMissionFromSupabase,
  saveMissionsToSupabase,
  updateMissionInSupabase,
} from '../services/supabaseService';
import { getSupabase } from '../services/authService';
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

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) {
      setMissions([]);
      setPayments([]);
      setIsLoaded(false);
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
      setIsLoaded(true);
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
    if (!user) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const missionsChannel = supabase
      .channel(`missions:user:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'missions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setMissions(current => current.filter(mission => mission.id !== deletedId));
            }
            return;
          }

          const remoteMission = dbToMission(payload.new);
          setMissions(current => {
            const existing = current.find(mission => mission.id === remoteMission.id);
            if (!existing) return [...current, remoteMission];

            if (
              existing.updatedAt &&
              remoteMission.updatedAt &&
              new Date(existing.updatedAt) > new Date(remoteMission.updatedAt)
            ) {
              return current;
            }

            return current.map(mission => mission.id === remoteMission.id ? remoteMission : mission);
          });
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel(`payments:user:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setPayments(current => current.filter(payment => payment.id !== deletedId));
            }
            return;
          }

          const remotePayment = dbToPayment(payload.new);
          setPayments(current => {
            const exists = current.some(payment => payment.id === remotePayment.id);
            return exists
              ? current.map(payment => payment.id === remotePayment.id ? remotePayment : payment)
              : [remotePayment, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(missionsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [user?.id]);

  // Save data
  useEffect(() => {
    if (isLoaded && user) {
      const saveData = async () => {
        setIsSaving(true);
        try {
          await saveMissions(missions, user.id);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde:', error);
        } finally {
          setIsSaving(false);
        }
      };

      const timeoutId = setTimeout(saveData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [missions, isLoaded, user?.id]);

  const addMission = useCallback((mission: Mission) => {
    const missionWithTimestamp = { ...mission, updatedAt: new Date().toISOString() };
    setMissions(prev => [...prev, missionWithTimestamp]);
    addMissionToSupabase(missionWithTimestamp).catch(error => {
      console.error('Erreur lors de la création distante:', error);
      toast.error('Mission sauvegardée localement, synchronisation distante en échec');
    });
    toast.success('Mission ajoutée');
  }, []);

  const updateMission = useCallback((mission: Mission) => {
    const missionWithTimestamp = { ...mission, updatedAt: new Date().toISOString() };
    setMissions(prev => prev.map(m => m.id === mission.id ? missionWithTimestamp : m));
    updateMissionInSupabase(missionWithTimestamp).catch(error => {
      console.error('Erreur lors de la mise à jour distante:', error);
      toast.error('Mission mise à jour localement, synchronisation distante en échec');
    });
    toast.success('Mission mise à jour');
  }, []);

  const deleteMission = useCallback((id: string) => {
    setMissions(prev => prev.filter(m => m.id !== id));
    deleteMissionFromSupabase(id).catch(error => {
      console.error('Erreur lors de la suppression distante:', error);
      toast.error('Suppression locale effectuée, synchronisation distante en échec');
    });
    toast.success('Mission supprimée');
  }, []);

  const importMissions = useCallback((importedMissions: Mission[]) => {
    const now = new Date().toISOString();
    const missionsWithTimestamp = importedMissions.map(mission => ({
      ...mission,
      updatedAt: mission.updatedAt || now,
    }));
    setMissions(missionsWithTimestamp);
    saveMissionsToSupabase(missionsWithTimestamp).catch(error => {
      console.error("Erreur lors de la synchronisation de l'import:", error);
      toast.error('Import local effectué, synchronisation distante en échec');
    });
    toast.success(`${importedMissions.length} missions importées`);
  }, []);

  const addPayment = useCallback(async (payment: Payment) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');
      await savePaymentToStorage(payment, user.id);
      setPayments(prev => [...prev.filter(p => p.id !== payment.id), payment]);

      // Mettre à jour les missions localement
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
      if (!user) throw new Error('Utilisateur non connecté');
      await deletePaymentFromStorage(id, user.id);
      setPayments(prev => prev.filter(p => p.id !== id));

      // Mettre à jour les missions localement (les marquer comme non payées)
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

  return (
    <MissionContext.Provider value={{
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
      refreshPayments: loadData
    }}>
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

