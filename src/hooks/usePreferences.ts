import { useState, useEffect, useCallback } from 'react';
import {
  loadPreferences,
  savePreferences,
  updatePreference,
  UserPreferences,
  getPreferencesKey
} from '../services/preferencesService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook personnalisé pour gérer les préférences utilisateur
 */
export const usePreferences = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences(userId));

  useEffect(() => {
    setPreferences(loadPreferences(userId));
  }, [userId]);

  // Écouter les changements de localStorage (pour la synchronisation multi-onglets)
  useEffect(() => {
    const key = getPreferencesKey(userId);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setPreferences(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Erreur lors de la lecture des préférences depuis storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userId]);

  /**
   * Met à jour une préférence spécifique
   */
  const update = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const updated = updatePreference(key, value, userId);
    setPreferences(updated);
    // Déclencher un événement personnalisé pour notifier les autres onglets
    window.dispatchEvent(new StorageEvent('storage', {
      key: getPreferencesKey(userId),
      newValue: JSON.stringify(updated),
    }));
  }, [userId]);

  /**
   * Bascule une préférence booléenne
   */
  const toggle = useCallback(<K extends keyof UserPreferences>(
    key: K
  ) => {
    const currentValue = preferences[key];
    if (typeof currentValue === 'boolean') {
      update(key, !currentValue as UserPreferences[K]);
    }
  }, [preferences, update]);

  return {
    preferences,
    update,
    toggle,
    hidePrices: preferences.hidePrices,
    setHidePrices: (value: boolean) => update('hidePrices', value),
    toggleHidePrices: () => toggle('hidePrices'),
    sidebarPinned: preferences.sidebarPinned,
    setSidebarPinned: (value: boolean) => update('sidebarPinned', value),
    toggleSidebarPinned: () => toggle('sidebarPinned'),
    dayRate: preferences.dayRate,
    setDayRate: (value: number) => update('dayRate', value),
    nightRate: preferences.nightRate,
    setNightRate: (value: number) => update('nightRate', value),
  };
};

