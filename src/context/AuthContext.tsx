import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, getCurrentUser, onAuthStateChange, signOut as authSignOut } from '../services/authService';
import { clearLegacyStorage } from '../services/legacyCleanup';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          clearLegacyStorage(); // Nettoyer les clés legacy au login
        }
        setUser(currentUser);
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const unsubscribe = onAuthStateChange((authUser) => {
      if (authUser) {
        clearLegacyStorage(); // Nettoyer les clés legacy à chaque changement d'auth
      }
      setUser(authUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    clearLegacyStorage(); // Nettoyer les clés legacy au logout
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

