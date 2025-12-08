import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Plus, ListChecks, LogOut, User, Euro } from 'lucide-react';
// Lazy loading pour optimiser les performances
const Dashboard = lazy(() => import('./components/Dashboard'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const MissionsList = lazy(() => import('./components/MissionsList'));
const PaymentsView = lazy(() => import('./components/PaymentsView'));
const MissionForm = lazy(() => import('./components/MissionForm'));
const ImageUploadMission = lazy(() => import('./components/ImageUploadMission'));
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
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
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
      <>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => {}} 
          onSuccess={handleAuthSuccess}
          initialMode="login"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300 text-gray-100 font-sans selection:bg-primary-500 selection:text-dark-300 antialiased relative z-10 overflow-y-auto">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-strong border-r border-gray-700/30 fixed inset-y-0 z-20 animate-slide-in-left shadow-lg">
        <div className="p-6 border-b border-gray-700/30 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 rounded-xl bg-primary-500 items-center justify-center shadow-md">
            <img
              src="/logo2.png"
              alt="Logo NeuroTime"
              className="h-10 w-10 object-contain"
            />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              <span className="text-primary-500" style={{letterSpacing: "-0.5px"}}>Neuro</span>
              <span className="text-primary-400 ml-0.5" style={{letterSpacing: "-0.5px"}}>Time</span>
            </h1>
            <span className="text-[0.7rem] text-gray-400 mt-0.5 block font-medium tracking-wider uppercase">Gestion</span>
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
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
            icon={<CalendarIcon size={19} />} 
            label="Agenda" 
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
            onClick={() => openNewMissionModal()}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md hover:shadow-lg"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="tracking-wide">Nouvelle mission</span>
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
              onClick={handleSignOut}
              className="w-full glass-button hover:bg-red-500/10 text-gray-300 hover:text-red-400 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:border-red-500/30 transition-all text-sm"
            >
              <LogOut size={14} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 bg-dark-300 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          <Suspense fallback={<LoadingSpinner fullScreen text="Chargement..." />}>
            {view === 'dashboard' && (
              <Dashboard 
                missions={missions} 
                onEdit={handleEditMission} 
                onValidate={handleValidateMission}
                onImport={handleImportData}
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
                onUploadImage={() => setIsImageUploadOpen(true)}
              />
            )}
            {view === 'calendar' && (
              <CalendarView 
                missions={missions} 
                onEdit={handleEditMission} 
                onDelete={handleDeleteMission} 
                onValidate={handleValidateMission}
                onNewMission={openNewMissionModal}
              />
            )}
            {view === 'payments' && (
              <PaymentsView 
                missions={missions} 
                onTogglePaid={handleTogglePaid}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-gray-700/30 z-30 pb-safe animate-slide-up shadow-lg">
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
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
            icon={<CalendarIcon size={22} />} 
            label="Agenda"
          />
          
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
        />
        <ImageUploadMission
          isOpen={isImageUploadOpen}
          onClose={() => setIsImageUploadOpen(false)}
          onSave={handleSaveMissions}
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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
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