import React, { useState } from 'react';
import { X, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { signUp, signIn } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setLoading(false);
          return;
        }
        const { user, error: signUpError } = await signUp(email, password);
        if (signUpError) {
          setError(signUpError.message || 'Erreur lors de l\'inscription');
        } else if (user) {
          onSuccess();
        }
      } else {
        const { user, error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message || 'Email ou mot de passe incorrect');
        } else if (user) {
          onSuccess();
        }
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 transition-all">
      <div className="bg-dark-50 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-dark-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b bg-dark-100 border-dark-200">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-100">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </h2>
            <p className="text-[10px] md:text-xs mt-0.5 text-gray-400">
              {mode === 'login' 
                ? 'Connectez-vous pour accéder à vos missions' 
                : 'Créez un compte pour commencer'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 md:p-2 hover:bg-dark-200 rounded-full transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1">
              <Mail size={12} className="text-gray-500" /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1">
              <Lock size={12} className="text-gray-500" /> Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? '••••••••' : 'Au moins 6 caractères'}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1">
                <Lock size={12} className="text-gray-500" /> Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-dark-100 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r text-dark-300 font-semibold py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base ${
              loading
                ? 'from-gray-500 to-gray-600 cursor-not-allowed'
                : 'from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-primary-500/30'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-dark-300 border-t-transparent rounded-full animate-spin" />
                <span>{mode === 'login' ? 'Connexion...' : 'Inscription...'}</span>
              </>
            ) : (
              <>
                {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                <span>{mode === 'login' ? 'Se connecter' : 'S\'inscrire'}</span>
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={switchMode}
              className="text-xs md:text-sm text-gray-400 hover:text-primary-400 transition-colors"
            >
              {mode === 'login' 
                ? 'Pas encore de compte ? S\'inscrire' 
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

