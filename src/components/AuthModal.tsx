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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby={error ? 'auth-error' : undefined}
        className="glass-strong rounded-[var(--radius-xl)] w-full max-w-sm overflow-hidden flex flex-col animate-scale-in border border-[var(--border-default)]"
      >

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-default)] bg-[var(--bg-elevated)] relative overflow-hidden">
          <div className="relative z-10">
            <h2 id="auth-modal-title" className="font-display text-base font-bold text-[var(--text-primary)]">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </h2>
            <p className="text-[10px] mt-0.5 text-[var(--text-tertiary)]">
              {mode === 'login'
                ? 'Connectez-vous à votre espace'
                : 'Créez un compte pour commencer'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.04] rounded-[var(--radius-md)] transition-all text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] relative z-10"
            aria-label="Fermer la fenêtre d’authentification"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Error Message */}
          {error && (
            <div
              id="auth-error"
              role="alert"
              className="bg-[var(--danger-light)] border border-[var(--danger)] rounded-[var(--radius-md)] p-2.5 flex items-center gap-2 text-[var(--danger)] text-[11px]"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="auth-email" className="text-[10px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
              <Mail size={10} className="text-[var(--text-tertiary)]" aria-hidden="true" /> Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="glass-input w-full px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label htmlFor="auth-password" className="text-[10px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
              <Lock size={10} className="text-[var(--text-tertiary)]" aria-hidden="true" /> Mot de passe
            </label>
            <input
              id="auth-password"
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? '••••••••' : 'Au moins 6 caractères'}
              className="glass-input w-full px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
            />
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-1">
              <label htmlFor="auth-confirm" className="text-[10px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Lock size={10} className="text-[var(--text-tertiary)]" aria-hidden="true" /> Confirmer
              </label>
              <input
                id="auth-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full px-3 py-2 rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`w-full font-bold py-2.5 px-4 rounded-[var(--radius-md)] transition-all flex items-center justify-center gap-2 text-xs shadow-md
              ${loading
                ? 'bg-[var(--bg-elevated)] cursor-not-allowed text-[var(--text-tertiary)]'
                : 'bg-gradient-to-r from-[var(--primary)] to-[#7c3aed] text-white shadow-[var(--primary-glow)]'}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 active:scale-[0.98]`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-white" aria-hidden="true" />
                <span>{mode === 'login' ? 'Connexion...' : 'Inscription...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {mode === 'login'
                  ? <LogIn size={15} className="text-white" aria-hidden="true" />
                  : <UserPlus size={15} className="text-white" aria-hidden="true" />}
                <span>{mode === 'login' ? 'Se connecter' : 'S\'inscrire'}</span>
              </span>
            )}
          </button>
        </form>

        {/* Mode switch */}
        <div className="px-4 pb-4 text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-[11px] text-[var(--text-primary)]0 hover:text-[var(--primary)] transition-colors"
          >
            {mode === 'login'
              ? 'Pas encore de compte ? Créer un compte'
              : 'Déjà un compte ? Se connecter'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
