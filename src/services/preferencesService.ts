const PREFERENCES_KEY = 'neurotime_preferences_v1';

export interface UserPreferences {
  hidePrices: boolean;
  sidebarPinned: boolean;
  dayRate: number;
  nightRate: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  hidePrices: false,
  sidebarPinned: false,
  dayRate: 20,
  nightRate: 30,
};

/**
 * Charge les préférences utilisateur depuis localStorage
 */
export const loadPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Fusionner avec les préférences par défaut pour supporter les nouvelles clés
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Erreur lors du chargement des préférences:', error);
  }
  return DEFAULT_PREFERENCES;
};

/**
 * Sauvegarde les préférences utilisateur dans localStorage
 */
export const savePreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error);
  }
};

/**
 * Met à jour une préférence spécifique
 */
export const updatePreference = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): UserPreferences => {
  const current = loadPreferences();
  const updated = { ...current, [key]: value };
  savePreferences(updated);
  return updated;
};

/**
 * Récupère une préférence spécifique
 */
export const getPreference = <K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] => {
  const preferences = loadPreferences();
  return preferences[key];
};

