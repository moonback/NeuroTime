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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby={error ? 'auth-error' : undefined}
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-[var(--shadow-elevated)] animate-scale-in"
      >
        <div className="border-b border-[var(--border-subtle)] px-6 pb-5 pt-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex rounded-full border border-[var(--border-subtle)] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                NeuroTime
              </div>
              <div>
                <h2 id="auth-modal-title" className="font-display text-2xl font-semibold tracking-[-0.045em] text-[var(--text-primary)]">
                  {mode === 'login' ? 'Bon retour' : 'Créer un espace'}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {mode === 'login'
                    ? 'Accédez à votre cockpit freelance en toute sécurité.'
                    : 'Configurez votre espace de pilotage en quelques secondes.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost inline-flex h-9 min-h-0 w-9 shrink-0 items-center justify-center p-0"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 rounded-xl border border-[var(--border-subtle)] bg-white/[0.025] p-1">
            <button
              type="button"
              onClick={() => mode !== 'login' && switchMode()}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white/[0.07] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => mode !== 'signup' && switchMode()}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-white/[0.07] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              Inscription
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div
              id="auth-error"
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="auth-email" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <Mail size={13} aria-hidden="true" /> Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.com"
              className="glass-input w-full px-3.5 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="auth-password" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <Lock size={13} aria-hidden="true" /> Mot de passe
            </label>
            <input
              id="auth-password"
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? '••••••••' : 'Au moins 6 caractères'}
              className="glass-input w-full px-3.5 text-sm"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="auth-confirm" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <Lock size={13} aria-hidden="true" /> Confirmer
              </label>
              <input
                id="auth-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full px-3.5 text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="btn-primary w-full px-4 text-sm font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z" />
                </svg>
                <span>{mode === 'login' ? 'Connexion…' : 'Inscription…'}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {mode === 'login'
                  ? <LogIn size={16} aria-hidden="true" />
                  : <UserPlus size={16} aria-hidden="true" />}
                <span>{mode === 'login' ? 'Se connecter' : 'S\'inscrire'}</span>
              </span>
            )}
          </button>
        </form>

        <div className="border-t border-[var(--border-subtle)] px-6 py-4 text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-hover)]"
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
