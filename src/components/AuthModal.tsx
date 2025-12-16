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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 md:p-4 transition-all animate-fade-in">
      <div className="glass-strong rounded-2xl md:rounded-3xl w-full max-w-md overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-primary-500/15 glass-light relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative z-10">
            <h2 className="text-lg md:text-xl font-bold text-gray-50">
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
            className="p-1.5 md:p-2 hover:bg-dark-200/50 rounded-full transition-all text-gray-400 hover:text-gray-200 hover:scale-110 relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/15 border border-red-500/25 rounded-lg p-3 flex items-center gap-2 text-red-300 text-sm backdrop-blur-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1.5">
              <Mail size={12} className="text-gray-400" /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-3 md:px-4 py-2 md:py-2.5 glass-light border-primary-500/15 rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1.5">
              <Lock size={12} className="text-gray-400" /> Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? '••••••••' : 'Au moins 6 caractères'}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 glass-light border-primary-500/15 rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium text-gray-200 flex items-center gap-1.5">
                <Lock size={12} className="text-gray-400" /> Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 md:px-4 py-2 md:py-2.5 glass-light border-primary-500/15 rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/40 outline-none transition-all text-sm text-gray-100 placeholder-gray-500"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`w-full font-semibold py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-2 text-sm md:text-base shadow-md hover:shadow-lg
              ${loading
                ? 'bg-gray-500/80 cursor-not-allowed text-gray-200'
                : 'bg-primary-500 hover:bg-primary-600 text-white'}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-primary-200" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"/>
                </svg>
                <span>
                  {mode === 'login' ? 'Connexion...' : 'Inscription...'}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {mode === 'login'
                  ? <LogIn size={18} className="text-white" aria-hidden="true" />
                  : <UserPlus size={18} className="text-white" aria-hidden="true" />}
                <span>
                  {mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
                </span>
              </span>
            )}
          </button>

          {/* Switch Mode */}
          {/* <div className="text-center pt-2">
            <button
              type="button"
              onClick={switchMode}
              className="text-xs md:text-sm text-gray-400 hover:text-primary-300 transition-colors font-medium"
            >
              {mode === 'login' 
                ? 'Pas encore de compte ? S\'inscrire' 
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div> */}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

