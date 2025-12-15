import { useState, useEffect, useCallback } from 'react';
import { 
  loadPreferences, 
  savePreferences, 
  updatePreference, 
  UserPreferences 
} from '../services/preferencesService';

/**
 * Hook personnalisé pour gérer les préférences utilisateur
 */
export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  // Écouter les changements de localStorage (pour la synchronisation multi-onglets)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'neurotime_preferences_v1' && e.newValue) {
        try {
          setPreferences(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Erreur lors de la lecture des préférences depuis storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Met à jour une préférence spécifique
   */
  const update = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const updated = updatePreference(key, value);
    setPreferences(updated);
    // Déclencher un événement personnalisé pour notifier les autres onglets
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'neurotime_preferences_v1',
      newValue: JSON.stringify(updated),
    }));
  }, []);

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
  };
};

