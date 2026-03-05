import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Mission, Payment } from '../types';
import { loadMissions, saveMissions, loadPayments, savePayment as savePaymentToStorage, deletePayment as deletePaymentFromStorage } from '../services/storageService';
import { useAuth } from './AuthContext';
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
      setIsLoaded(false);
      return;
    }

    setIsLoading(true);
    try {
      const [missionsData, paymentsData] = await Promise.all([
        loadMissions(),
        loadPayments()
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
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save data
  useEffect(() => {
    if (isLoaded && user && missions.length > 0) {
      const saveData = async () => {
        setIsSaving(true);
        try {
          await saveMissions(missions);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde:', error);
        } finally {
          setIsSaving(false);
        }
      };

      const timeoutId = setTimeout(saveData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [missions, isLoaded, user]);

  const addMission = useCallback((mission: Mission) => {
    setMissions(prev => [...prev, mission]);
    toast.success('Mission ajoutée');
  }, []);

  const updateMission = useCallback((mission: Mission) => {
    setMissions(prev => prev.map(m => m.id === mission.id ? mission : m));
    toast.success('Mission mise à jour');
  }, []);

  const deleteMission = useCallback((id: string) => {
    setMissions(prev => prev.filter(m => m.id !== id));
    toast.success('Mission supprimée');
  }, []);

  const importMissions = useCallback((importedMissions: Mission[]) => {
    setMissions(importedMissions);
    toast.success(`${importedMissions.length} missions importées`);
  }, []);

  const addPayment = useCallback(async (payment: Payment) => {
    try {
      await savePaymentToStorage(payment);
      setPayments(prev => [...prev.filter(p => p.id !== payment.id), payment]);

      // Mettre à jour les missions localement
      setMissions(prev => prev.map(m =>
        payment.missionIds.includes(m.id)
          ? { ...m, isPaid: true, paymentId: payment.id }
          : m
      ));

      toast.success('Paiement enregistré');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    try {
      await deletePaymentFromStorage(id);
      setPayments(prev => prev.filter(p => p.id !== id));

      // Mettre à jour les missions localement (les marquer comme non payées)
      setMissions(prev => prev.map(m =>
        m.paymentId === id
          ? { ...m, isPaid: false, paymentId: undefined }
          : m
      ));

      toast.success('Paiement supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du paiement:', error);
      toast.error('Erreur lors de la suppression du paiement');
    }
  }, []);

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

