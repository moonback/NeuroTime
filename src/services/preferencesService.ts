export const getPreferencesKey = (userId?: string | null) => userId ? `neurotime_preferences_${userId}_v2` : 'neurotime_preferences_anonymous_v2';

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
export const loadPreferences = (userId?: string | null): UserPreferences => {
  try {
    const key = getPreferencesKey(userId);
    const stored = localStorage.getItem(key);
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
export const savePreferences = (preferences: UserPreferences, userId?: string | null): void => {
  try {
    const key = getPreferencesKey(userId);
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error);
  }
};

/**
 * Met à jour une préférence spécifique
 */
export const updatePreference = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
  userId?: string | null
): UserPreferences => {
  const current = loadPreferences(userId);
  const updated = { ...current, [key]: value };
  savePreferences(updated, userId);
  return updated;
};

/**
 * Récupère une préférence spécifique
 */
export const getPreference = <K extends keyof UserPreferences>(
  key: K,
  userId?: string | null
): UserPreferences[K] => {
  const preferences = loadPreferences(userId);
  return preferences[key];
};

