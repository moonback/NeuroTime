import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')) {
      setIsInstalled(true);
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Afficher le prompt après un délai (optionnel)
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true);
        }
      }, 3000); // Afficher après 3 secondes
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Vérifier si installé après installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt();
      
      // Attendre que l'utilisateur réponde
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installée avec succès');
      } else {
        console.log('Installation PWA refusée');
      }
      
      // Nettoyer
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Ne pas afficher si déjà installée ou si pas de prompt disponible
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  // Détecter le type d'appareil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-in-up">
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-2xl p-4 md:p-5 border border-primary-500/30 backdrop-blur-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isMobile ? (
              <Smartphone className="text-white" size={24} />
            ) : (
              <Monitor className="text-white" size={24} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm md:text-base mb-1">
              Installer NeuroTime
            </h3>
            <p className="text-primary-100 text-xs md:text-sm mb-3">
              {isIOS 
                ? 'Appuyez sur le bouton Partage puis "Sur l\'écran d\'accueil"'
                : 'Installez l\'application pour un accès rapide et une utilisation hors ligne'
              }
            </p>
            
            {!isIOS && (
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-white text-primary-700 font-semibold py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Installer
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 text-primary-200 hover:text-white hover:bg-primary-500/30 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            
            {isIOS && (
              <button
                onClick={handleDismiss}
                className="w-full bg-white/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                Compris
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;

