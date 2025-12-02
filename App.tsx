import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Plus, Menu, ListChecks, LogOut, User, DollarSign, Columns } from 'lucide-react';
// Lazy loading pour optimiser les performances
const Dashboard = lazy(() => import('./components/Dashboard'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const MissionsList = lazy(() => import('./components/MissionsList'));
const MissionForm = lazy(() => import('./components/MissionForm'));
const FinanceView = lazy(() => import('./components/FinanceView'));
const KanbanView = lazy(() => import('./components/KanbanView'));
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

  const handleEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setSelectedDateForNew(undefined);
    setIsModalOpen(true);
  };

  // Special handler to convert a planned mission to completed (validate hours)
  const handleValidateMission = (mission: Mission) => {
    const missionToValidate = { ...mission, status: 'completed' as const };
    setEditingMission(missionToValidate);
    setSelectedDateForNew(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteMission = useCallback((id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette mission ?")) {
      setMissions(prev => prev.filter(m => m.id !== id));
    }
  }, []);

  const handleStatusChange = useCallback((missionId: string, newStatus: 'planned' | 'completed' | 'cancelled') => {
    setMissions(prev => prev.map(m => 
      m.id === missionId ? { ...m, status: newStatus } : m
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
      <aside className="hidden md:flex flex-col w-64 glass-strong border-r border-primary-500/30 fixed inset-y-0 z-20 animate-slide-in-left">
        <div className="p-6 border-b border-primary-700/20 flex items-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          <span className="inline-flex h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-lg items-center justify-center relative z-10 animate-float overflow-hidden">
            <img
              src="/logo2.png"
              alt="Logo NeuroTime"
              className="h-9 w-9 object-contain"
            />
          </span>
          <div className="relative z-10">
            <h1 className="text-xl font-semibold tracking-tight leading-tight">
              <span className="text-[#008CFF] drop-shadow-[0_1px_5px_rgba(0,140,255,0.25)]" style={{letterSpacing: "-0.5px"}}>Neuro</span>
              <span className="text-[#76CCFF] ml-0.5 drop-shadow-[0_1px_5px_rgba(118,204,255,0.2)]" style={{letterSpacing: "-0.5px"}}>Time</span>
            </h1>
            <span className="text-[0.65rem] text-primary-400 mt-0.5 block font-medium opacity-80">Gestion</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <NavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Tableau de bord" 
          />
          <NavButton 
            active={view === 'missions'} 
            onClick={() => setView('missions')} 
            icon={<ListChecks size={20} />} 
            label="Missions" 
          />
          <NavButton 
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
            icon={<CalendarIcon size={20} />} 
            label="Agenda" 
          />
          <NavButton 
            active={view === 'finance'} 
            onClick={() => setView('finance')} 
            icon={<DollarSign size={20} />} 
            label="Finance" 
          />
          <NavButton 
            active={view === 'kanban'} 
            onClick={() => setView('kanban')} 
            icon={<Columns size={20} />} 
            label="Kanban" 
          />
        </nav>

        <div className="p-4 space-y-2 border-t border-primary-500/20">
           <button 
            onClick={() => openNewMissionModal()}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-dark-300 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 glow-blue transition-all text-sm relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <Plus size={18} className="relative z-10" />
            <span className="relative z-10">Nouvelle mission</span>
          </button>
          
          {/* User Info & Logout */}
          <div className="pt-2 border-t border-primary-500/20 mt-2">
            <div className="flex items-center gap-2 px-2 py-2 mb-2 text-xs text-gray-400">
              <User size={14} />
              <span className="truncate">{user.email || 'Utilisateur'}</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full glass-button hover:bg-red-500/20 text-gray-300 hover:text-red-300 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:border-red-500/30 transition-all text-sm"
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
            {view === 'finance' && (
              <FinanceView missions={missions} />
            )}
            {view === 'kanban' && (
              <KanbanView 
                missions={missions} 
                onEdit={handleEditMission} 
                onDelete={handleDeleteMission}
                onStatusChange={handleStatusChange}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-primary-500/30 z-30 pb-safe animate-slide-up">
        <div className="flex justify-around items-center px-2 py-2">
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

          <div className="relative -top-7">
            <button 
              onClick={() => openNewMissionModal()}
              className="bg-gradient-to-br from-primary-500 to-primary-600 text-dark-300 p-3.5 rounded-full glow-blue-strong transform active:scale-90 transition-all ring-4 ring-dark-50 hover:scale-110 relative overflow-hidden group"
              aria-label="Nouvelle mission"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <Plus size={24} strokeWidth={2.5} className="relative z-10" />
            </button>
          </div>

          <MobileNavButton 
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
            icon={<CalendarIcon size={22} />} 
            label="Agenda"
          />
          <MobileNavButton 
            active={view === 'finance'} 
            onClick={() => setView('finance')} 
            icon={<DollarSign size={22} />} 
            label="Finance"
          />
          <MobileNavButton 
            active={view === 'kanban'} 
            onClick={() => setView('kanban')} 
            icon={<Columns size={22} />} 
            label="Kanban"
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
        <div className="fixed bottom-4 right-4 z-40 glass-card px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-400 animate-slide-in-up animate-glass-shine">
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
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm relative overflow-hidden group ${
      active 
        ? 'glass-button text-primary-300 font-semibold glow-blue' 
        : 'text-gray-400 hover:glass-button hover:text-primary-300'
    }`}
  >
    <span className={`absolute inset-0 bg-gradient-to-r from-primary-500/10 via-primary-400/20 to-primary-500/10 translate-x-[-100%] transition-transform duration-500 ${active ? 'translate-x-0' : 'group-hover:translate-x-[100%]'}`}></span>
    <span className="relative z-10 flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[60px] ${
      active 
        ? 'text-primary-400 bg-primary-500/20' 
        : 'text-gray-500 active:text-primary-400'
    }`}
  >
    {icon}
    {label && <span className="text-[10px] mt-1 font-semibold leading-tight">{label}</span>}
  </button>
);

export default App;