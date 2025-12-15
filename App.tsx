import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { LayoutDashboard, Plus, ListChecks, LogOut, User, Euro, Eye, EyeOff } from 'lucide-react';
import { usePreferences } from './hooks/usePreferences';
// Lazy loading pour optimiser les performances
const Dashboard = lazy(() => import('./components/Dashboard'));
const MissionsList = lazy(() => import('./components/MissionsList'));
const PaymentsView = lazy(() => import('./components/PaymentsView'));
const MissionForm = lazy(() => import('./components/MissionForm'));
import AuthModal from './components/AuthModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import SplashScreen from './components/SplashScreen';
import { Mission, ViewState } from './types';
import { loadMissions, saveMissions } from './services/storageService';
import { getCurrentUser, onAuthStateChange, signOut, AuthUser } from './services/authService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | undefined>(undefined);
  
  // Authentification
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // État pour éviter d'écraser le localStorage au démarrage avant le chargement
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Splash screen - se masque une fois l'auth vérifiée
  const [showSplash, setShowSplash] = useState(true);
  
  // Préférences utilisateur
  const { hidePrices, toggleHidePrices } = usePreferences();

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        setIsAuthModalOpen(true);
      }
    };
    
    checkAuth();
    
    // Écouter les changements d'authentification
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      if (!authUser) {
        setIsAuthModalOpen(true);
        setMissions([]);
        setIsLoaded(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Load data on mount (seulement si connecté)
  useEffect(() => {
    if (user && !isLoaded) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const data = await loadMissions();
          setMissions(data);
          setIsLoaded(true);
        } catch (error) {
          console.error('Erreur lors du chargement:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [user, isLoaded]);

  // Save data whenever it changes, BUT only if initial load is done
  useEffect(() => {
    if (isLoaded && missions.length > 0) {
      const saveData = async () => {
        setIsSaving(true);
        try {
          await saveMissions(missions);
        } catch (error: any) {
          console.error('Erreur lors de la sauvegarde:', error);
        } finally {
          setIsSaving(false);
        }
      };
      
      // Debounce pour éviter trop de sauvegardes
      const timeoutId = setTimeout(saveData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [missions, isLoaded]);

  const handleSaveMission = useCallback((mission: Mission) => {
    if (editingMission) {
      setMissions(prev => prev.map(m => m.id === mission.id ? mission : m));
    } else {
      setMissions(prev => [...prev, mission]);
    }
    setEditingMission(null);
  }, [editingMission]);

  const handleSaveMissions = useCallback((newMissions: Mission[]) => {
    setMissions(prev => [...prev, ...newMissions]);
  }, []);

  const handleEditMission = (mission: Mission) => {
    if (mission.isPaid) {
      alert('Cette mission a été payée et ne peut plus être modifiée.');
      return;
    }
    setEditingMission(mission);
    setSelectedDateForNew(undefined);
    setIsModalOpen(true);
  };

  // Special handler to convert a planned mission to completed (validate hours)
  const handleValidateMission = (mission: Mission) => {
    if (mission.isPaid) {
      alert('Cette mission a été payée et ne peut plus être modifiée.');
      return;
    }
    const missionToValidate = { ...mission, status: 'completed' as const };
    setEditingMission(missionToValidate);
    setSelectedDateForNew(undefined);
    setIsModalOpen(true);
  };

  // Handler to directly mark a mission as completed (without opening form)
  const handleCompleteMission = useCallback((mission: Mission) => {
    if (window.confirm(`Marquer la mission "${mission.title}" comme terminée ?`)) {
      setMissions(prev => prev.map(m => 
        m.id === mission.id ? { ...m, status: 'completed' as const } : m
      ));
    }
  }, []);

  const handleDeleteMission = useCallback((id: string) => {
    const mission = missions.find(m => m.id === id);
    if (mission?.isPaid) {
      alert('Cette mission a été payée et ne peut plus être supprimée.');
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette mission ?")) {
      setMissions(prev => prev.filter(m => m.id !== id));
    }
  }, [missions]);

  const handleTogglePaid = useCallback((mission: Mission) => {
    setMissions(prev => prev.map(m => 
      m.id === mission.id ? { ...m, isPaid: !m.isPaid } : m
    ));
  }, []);

  const handleImportData = useCallback((importedMissions: Mission[]) => {
    if (window.confirm(`Attention, l'importation va remplacer vos ${missions.length} missions actuelles par ${importedMissions.length} missions importées. Continuer ?`)) {
      setMissions(importedMissions);
    }
  }, [missions]);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // Recharger les données après connexion
    const loadData = async () => {
      const data = await loadMissions();
      setMissions(data);
      setIsLoaded(true);
    };
    loadData();
  };

  const handleSignOut = useCallback(async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try {
        await signOut();
        setMissions([]);
        setIsLoaded(false);
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    }
  }, []);

  const openNewMissionModal = (dateStr?: string) => {
    setEditingMission(null);
    setSelectedDateForNew(dateStr);
    setIsModalOpen(true);
  };

  // Splash screen - s'affiche au démarrage jusqu'à ce que l'auth soit vérifiée
  if (showSplash) {
    return (
      <SplashScreen 
        onFinish={() => setShowSplash(false)}
        minDisplayTime={1500}
        ready={!authLoading}
      />
    );
  }

  // Afficher le modal d'authentification si non connecté
  if (authLoading) {
    return <LoadingSpinner fullScreen text="Chargement..." />;
  }
  
  if (isLoading && !isLoaded) {
    return <LoadingSpinner fullScreen text="Chargement des missions..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen neo-aurora flex items-center justify-center relative overflow-hidden">
        <div className="aurora-layer">
          <div className="aurora-blob primary" style={{ top: '-10%', left: '-10%' }} />
          <div className="aurora-blob pink" style={{ top: '20%', right: '-10%' }} />
          <div className="aurora-blob teal small" style={{ bottom: '-10%', left: '20%' }} />
        </div>
        
        {/* Simple Welcome/Login container if AuthModal is not immediately visible or to provide background */}
        <div className="z-10 text-center">
             {/* AuthModal handles the login form. 
                If we want it always visible when !user, we can just render it. 
                The previous code used isAuthModalOpen. 
                We'll keep using it but ensure it's true or the modal is triggered.
             */}
        </div>

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={handleAuthSuccess}
          initialMode="login"
        />
        
        {/* Fallback button in case modal is closed but user is not logged in */}
        {!isAuthModalOpen && (
          <div className="glass-card p-8 rounded-2xl border-white/10 flex flex-col items-center gap-4 z-20 animate-fade-in">
             <img src="/logo.png" alt="NeuroTime" className="w-24 h-24 object-contain mb-2" />
             <h1 className="text-3xl font-bold text-white">NeuroTime</h1>
             <p className="text-gray-400 mb-4">Gestion intelligente pour freelances</p>
             <button 
               onClick={() => setIsAuthModalOpen(true)}
               className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
             >
               Se connecter
             </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen neo-aurora text-gray-100 font-sans selection:bg-primary-500 selection:text-dark-300 antialiased relative z-10 overflow-y-auto">
      <div className="aurora-layer">
        <div className="aurora-blob primary" style={{ top: '-120px', left: '-60px' }} />
        <div className="aurora-blob pink" style={{ top: '-80px', right: '-100px' }} />
        <div className="aurora-blob teal small" style={{ bottom: '-120px', left: '20%' }} />
      </div>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-strong border-r border-gray-700/30 fixed inset-y-0 z-20 animate-slide-in-left shadow-lg backdrop-blur-xl">
        <div className="p-6 border-b border-gray-700/30">
          <div className="w-full  rounded-2xl shadow-lg backdrop-blur-xl overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-20 object-contain"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <NavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<LayoutDashboard size={19} />} 
            label="Tableau de bord" 
          />
          <NavButton 
            active={view === 'missions'} 
            onClick={() => setView('missions')} 
            icon={<ListChecks size={19} />} 
            label="Missions" 
          />
          <NavButton 
            active={view === 'payments'} 
            onClick={() => setView('payments')} 
            icon={<Euro size={19} />} 
            label="Paiements" 
          />
        </nav>

        <div className="p-4 space-y-3 border-t border-gray-700/30">
           <button
            onClick={openNewMissionModal}
            className="
              w-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500
              hover:from-primary-600 hover:to-primary-700 hover:shadow-xl
              hover:scale-[1.03] transition-transform
              text-white font-semibold py-3 px-4 rounded-xl
              flex items-center justify-center gap-2
              transition-all text-sm shadow-md
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/70
              active:scale-[0.97] ring-inset"
            aria-label="Créer une nouvelle mission"
            type="button"
          >
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white/10 shadow-inner group-hover:bg-primary-600/20 transition-colors">
              <Plus size={18} strokeWidth={2.3} className="text-primary-50 drop-shadow" />
            </span>
            <span className="tracking-wide font-medium">Nouvelle mission</span>
          </button>
          
          {/* User Info & Logout */}
          <div className="pt-2 border-t border-gray-700/30 mt-2">
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 text-xs glass-light rounded-lg border border-gray-700/30">
              <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30">
                <User size={12} className="text-primary-400" />
              </div>
              <span className="truncate text-gray-200 font-medium">{user.email || 'Utilisateur'}</span>
            </div>
            <button 
              onClick={toggleHidePrices}
              className="w-full glass-button hover:bg-orange-500/10 text-gray-300 hover:text-orange-400 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:border-orange-500/30 transition-all text-sm mb-2"
              title={hidePrices ? "Afficher les tarifs" : "Masquer les tarifs"}
            >
              {hidePrices ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{hidePrices ? 'Afficher tarifs' : 'Masquer tarifs'}</span>
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full glass-button hover:bg-red-500/10 text-gray-300 hover:text-red-400 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:border-red-500/30 transition-all text-sm"
            >
              <LogOut size={14} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 glass-strong border-b border-gray-700/30 z-30 pb-safe backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-8 object-contain"
            />
            <span className="text-lg font-bold text-gray-100">NeuroTime</span>
          </div>
          <button 
            onClick={toggleHidePrices}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-all ${
              hidePrices 
                ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400' 
                : 'bg-gray-700/30 border border-gray-600/40 text-gray-300 hover:bg-gray-600/40'
            }`}
            title={hidePrices ? "Afficher les tarifs" : "Masquer les tarifs"}
          >
            {hidePrices ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 bg-transparent overflow-y-auto relative pt-16 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in relative">
          <Suspense fallback={<LoadingSpinner fullScreen text="Chargement..." />}>
            {view === 'dashboard' && (
              <Dashboard 
                missions={missions} 
                onEdit={handleEditMission} 
                onValidate={handleValidateMission}
                onImport={handleImportData}
                hidePrices={hidePrices}
              />
            )}
            {view === 'missions' && (
              <MissionsList 
                missions={missions} 
                onEdit={handleEditMission} 
                onDelete={handleDeleteMission} 
                onNew={() => openNewMissionModal()}
                onTogglePaid={handleTogglePaid}
                onComplete={handleCompleteMission}
                hidePrices={hidePrices}
              />
            )}
            {view === 'payments' && (
              <PaymentsView 
                missions={missions} 
                onTogglePaid={handleTogglePaid}
                hidePrices={hidePrices}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-gray-700/30 z-30 pb-safe animate-slide-up shadow-lg backdrop-blur-xl">
        <div className="flex justify-around items-center px-3 py-2.5">
          <MobileNavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<LayoutDashboard size={22} />} 
            label="Accueil"
          />
          
          <MobileNavButton 
            active={view === 'missions'} 
            onClick={() => setView('missions')} 
            icon={<ListChecks size={22} />} 
            label="Missions"
          />

          <div className="relative -top-8">
            <button 
              onClick={() => openNewMissionModal()}
              className="bg-primary-500 hover:bg-primary-600 text-white p-4 rounded-full transform active:scale-90 transition-all ring-4 ring-dark-300/80 hover:scale-110 shadow-lg"
              aria-label="Nouvelle mission"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>

          
          <MobileNavButton 
            active={view === 'payments'} 
            onClick={() => setView('payments')} 
            icon={<Euro size={22} />} 
            label="Paiements"
          />
        </div>
      </nav>

      <Suspense fallback={null}>
        <MissionForm 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveMission}
          initialData={editingMission}
          defaultDate={selectedDateForNew}
          missions={missions}
          hidePrices={hidePrices}
        />
      </Suspense>

      <AuthModal 
        isOpen={isAuthModalOpen && !user} 
        onClose={() => {}} 
        onSuccess={handleAuthSuccess}
        initialMode="login"
      />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 z-40 glass-card px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-400 animate-slide-in-up">
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Sauvegarde...</span>
        </div>
      )}
    </div>
  );
};

// Sub-components for Nav
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium relative overflow-hidden ${
      active 
        ? 'glass-button text-primary-400 font-semibold shadow-md border-primary-500/30 bg-primary-500/10' 
        : 'text-gray-400 hover:glass-button hover:text-primary-300 hover:shadow-sm'
    }`}
  >
    <span className="flex items-center gap-3">
      <span className={`transition-transform duration-200 ${active ? 'scale-105' : ''}`}>
        {icon}
      </span>
      <span className="tracking-wide">{label}</span>
    </span>
    {active && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary-500"></span>
    )}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all min-w-[60px] relative ${
      active 
        ? 'text-primary-400 bg-primary-500/15 shadow-md border border-primary-500/30' 
        : 'text-gray-500 active:text-primary-400 active:bg-primary-500/10'
    }`}
  >
    <span className={`transition-transform duration-200 ${active ? 'scale-105' : ''}`}>
      {icon}
    </span>
    {label && <span className={`text-[10px] mt-1 font-semibold leading-tight tracking-wide ${active ? 'text-primary-300' : ''}`}>{label}</span>}
    {active && (
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"></span>
    )}
  </button>
);

export default App;