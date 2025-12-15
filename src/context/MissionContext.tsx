import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Mission } from '../types';
import { loadMissions, saveMissions } from '../services/storageService';
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
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
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
      const data = await loadMissions();
      setMissions(data);
      setIsLoaded(true);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des missions');
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

  return (
    <MissionContext.Provider value={{ 
      missions, 
      isLoading, 
      isSaving, 
      addMission, 
      updateMission, 
      deleteMission,
      refreshMissions: loadData,
      importMissions
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

