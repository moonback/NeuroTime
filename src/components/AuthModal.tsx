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
      <div className="glass-strong rounded-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scale-in border border-white/[0.08]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/[0.06] bg-white/[0.03] relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-base font-bold text-gray-50">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </h2>
            <p className="text-[10px] mt-0.5 text-gray-400">
              {mode === 'login'
                ? 'Connectez-vous à votre espace'
                : 'Créez un compte pour commencer'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all text-gray-400 hover:text-gray-200 relative z-10"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-center gap-2 text-red-300 text-[11px]">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-300 flex items-center gap-1">
              <Mail size={10} className="text-gray-400" /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all text-xs text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-gray-300 flex items-center gap-1">
              <Lock size={10} className="text-gray-400" /> Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? '••••••••' : 'Au moins 6 caractères'}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all text-xs text-gray-100 placeholder-gray-500"
            />
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-300 flex items-center gap-1">
                <Lock size={10} className="text-gray-400" /> Confirmer
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all text-xs text-gray-100 placeholder-gray-500"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`w-full font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md
              ${loading
                ? 'bg-gray-500/60 cursor-not-allowed text-gray-300'
                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_2px_12px_rgba(99,102,241,0.25)]'}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 active:scale-[0.98]`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-indigo-200" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z" />
                </svg>
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
      </div>
    </div>
  );
};

export default AuthModal;
