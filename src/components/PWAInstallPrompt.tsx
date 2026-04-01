import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Monitor, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// How long (ms) before the banner re-appears after dismissal
const REDISPLAY_DELAY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already running as a standalone PWA — never show
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const canShow =
        !dismissed || Date.now() - Number(dismissed) > REDISPLAY_DELAY_MS;

      if (canShow) {
        // Small delay so the app has a moment to render first
        setTimeout(() => setShowPrompt(true), 2500);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Escape key to dismiss
  useEffect(() => {
    if (!showPrompt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPrompt]);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch {
      // Prompt was already used or user cancelled — silent fail
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  if (isInstalled || !showPrompt || !deferredPrompt) return null;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div
      role="banner"
      aria-label="Installer l'application NeuroTime"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xs z-50 animate-slide-in-up"
    >
      <div className="glass-strong rounded-2xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 mt-0.5">
            {isMobile
              ? <Smartphone size={18} strokeWidth={2} aria-hidden="true" />
              : <Monitor size={18} strokeWidth={2} aria-hidden="true" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-gray-100 leading-tight mb-0.5">
              Installer NeuroTime
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
              {isIOS
                ? 'Appuyez sur Partage → "Sur l\'écran d\'accueil" pour un accès rapide.'
                : 'Accès hors ligne, notifications et lancement instantané.'
              }
            </p>

            {isIOS ? (
              <button
                onClick={handleDismiss}
                className="w-full glass-button px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white text-center"
              >
                Compris
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/20"
                >
                  <Download size={13} aria-hidden="true" />
                  Installer
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 glass-button rounded-xl text-gray-400 hover:text-gray-200"
                  aria-label="Ignorer l'invitation à installer"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Close — always visible */}
          {isIOS && (
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1.5 glass-button rounded-lg text-gray-500 hover:text-gray-300"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
