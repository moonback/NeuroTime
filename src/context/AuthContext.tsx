import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, signOut as authSignOut, getSupabase } from '../services/authService';
import { clearLegacyStorage } from '../services/storageService';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAuthUser = (user: User | null): AuthUser | null => (
  user ? { id: user.id, email: user.email } : null
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) clearLegacyStorage();
      setUser(toAuthUser(data.session?.user ?? null));
      setLoading(false);
    }).catch(error => {
      if (cancelled) return;
      console.error('Auth bootstrap failed', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearLegacyStorage();
      setUser(toAuthUser(session?.user ?? null));
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    clearLegacyStorage();
    await authSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
