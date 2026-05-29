/**
 * Utilitaire pour réessayer automatiquement les requêtes Supabase en cas d'échec
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 seconde
  maxDelay: 10000, // 10 secondes
  backoffMultiplier: 2,
  retryableErrors: ['network', 'fetch', 'Failed to fetch', 'timeout', 'ECONNRESET', 'ETIMEDOUT'],
};

/**
 * Vérifie si une erreur est réessayable
 */
const getErrorField = (error: unknown, field: 'message' | 'code'): string => {
  if (typeof error === 'object' && error !== null && field in error) {
    const value = (error as Record<typeof field, unknown>)[field];
    return typeof value === 'string' ? value : '';
  }
  return '';
};

const isRetryableError = (error: unknown, retryableErrors: string[]): boolean => {
  if (!error) return false;

  const errorMessage = (getErrorField(error, 'message') || String(error) || '').toLowerCase();
  const errorCode = getErrorField(error, 'code');
  
  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError.toLowerCase()) ||
    errorCode.toLowerCase().includes(retryableError.toLowerCase())
  );
};

/**
 * Calcule le délai avant le prochain essai (backoff exponentiel)
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number => {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
};

/**
 * Attend un certain nombre de millisecondes
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Réessaye une fonction en cas d'échec avec backoff exponentiel
 * 
 * @param fn - La fonction à exécuter
 * @param options - Options de retry
 * @returns Le résultat de la fonction
 * @throws La dernière erreur si tous les essais échouent
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Si c'est le dernier essai, on lance l'erreur
      if (attempt === opts.maxRetries) {
        throw error;
      }

      // Vérifier si l'erreur est réessayable
      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error;
      }

      // Calculer le délai avant le prochain essai
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      console.warn(
        `Tentative ${attempt + 1}/${opts.maxRetries + 1} échouée, nouvelle tentative dans ${delay}ms...`,
        error
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

