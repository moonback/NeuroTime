import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pour le client Supabase (évite les multiples instances)
let supabaseClient: SupabaseClient | null = null;

// Initialisation du client Supabase pour l'authentification
const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Variables Supabase manquantes. Vérifiez votre fichier .env.local');
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};

export interface AuthUser {
  id: string;
  email?: string;
}

// Inscription avec email et mot de passe
export const signUp = async (email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { user: null, error: new Error('Supabase non configuré') };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error as Error };
    }

    return {
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      error: null,
    };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// Connexion avec email et mot de passe
export const signIn = async (email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { user: null, error: new Error('Supabase non configuré') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error as Error };
    }

    return {
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      error: null,
    };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// Déconnexion
export const signOut = async (): Promise<{ error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: new Error('Supabase non configuré') };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
  } catch (error) {
    return { error: error as Error };
  }
};

// Obtenir l'utilisateur actuel
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email } : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

// Écouter les changements d'authentification
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ? { id: session.user.id, email: session.user.email } : null;
    callback(user);
  });

  return () => {
    subscription.unsubscribe();
  };
};

// Obtenir le client Supabase (pour utilisation dans d'autres services)
export const getSupabase = () => getSupabaseClient();

