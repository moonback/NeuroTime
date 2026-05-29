/**
 * Nettoyage des clés localStorage legacy (non scopées par userId).
 * À appeler au signIn et au signOut pour éviter que des données
 * d'un compte soient poussées vers un autre.
 */
const LEGACY_KEYS = [
  'NeuroTime_missions_v1',
  'NeuroTime_payments_v1',
  'neurotime_clients_v1',
  'neurotime_preferences_v1',
];

export const clearLegacyStorage = (): void => {
  LEGACY_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore les erreurs silencieusement (ex: SSR, iframe sandboxé)
    }
  });
};
