import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Plus, Menu, ListChecks, Sparkles, LogOut, User, DollarSign } from 'lucide-react';
// Lazy loading pour optimiser les performances
const Dashboard = lazy(() => import('./components/Dashboard'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const MissionsList = lazy(() => import('./components/MissionsList'));
const MissionForm = lazy(() => import('./components/MissionForm'));
const ImageImportModal = lazy(() => import('./components/ImageImportModal'));
const FinanceView = lazy(() => import('./components/FinanceView'));
import AuthModal from './components/AuthModal';
import { ToastContainer, useToast } from './components/Toast';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Mission, ViewState } from './types';
import { loadMissions, saveMissions } from './services/storageService';
import { getCurrentUser, onAuthStateChange, signOut, AuthUser } from './services/authService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
  
  // Toast notifications
  const toast = useToast();

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
          toast.success(`${data.length} mission${data.length > 1 ? 's' : ''} chargée${data.length > 1 ? 's' : ''}`);
        } catch (error) {
          console.error('Erreur lors du chargement:', error);
          toast.error('Erreur lors du chargement des missions. Vérifiez votre connexion.');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [user, isLoaded, toast]);

  // Save data whenever it changes, BUT only if initial load is done
  useEffect(() => {
    if (isLoaded && missions.length > 0) {
      const saveData = async () => {
        setIsSaving(true);
        try {
          await saveMissions(missions);
        } catch (error: any) {
          console.error('Erreur lors de la sauvegarde:', error);
          const errorMessage = error?.message || 'Erreur inconnue';
          if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            toast.warning('Sauvegarde en cours... (mode hors ligne)');
          } else {
            toast.error('Erreur lors de la sauvegarde. Les données sont sauvegardées localement.');
          }
        } finally {
          setIsSaving(false);
        }
      };
      
      // Debounce pour éviter trop de sauvegardes
      const timeoutId = setTimeout(saveData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [missions, isLoaded, toast]);

  const handleSaveMission = useCallback((mission: Mission) => {
    if (editingMission) {
      setMissions(prev => prev.map(m => m.id === mission.id ? mission : m));
      toast.success('Mission modifiée avec succès');
    } else {
      setMissions(prev => [...prev, mission]);
      toast.success('Mission créée avec succès');
    }
    setEditingMission(null);
  }, [editingMission, toast]);

  const handleBulkAddMissions = useCallback((newMissions: Mission[]) => {
    setMissions(prev => [...prev, ...newMissions]);
    toast.success(`${newMissions.length} mission${newMissions.length > 1 ? 's' : ''} importée${newMissions.length > 1 ? 's' : ''}`);
  }, [toast]);

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
      toast.success('Mission supprimée');
    }
  }, [toast]);

  const handleImportData = useCallback((importedMissions: Mission[]) => {
    if (window.confirm(`Attention, l'importation va remplacer vos ${missions.length} missions actuelles par ${importedMissions.length} missions importées. Continuer ?`)) {
      setMissions(importedMissions);
      toast.success('Données restaurées avec succès !');
    }
  }, [missions, toast]);

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
        toast.info('Déconnexion réussie');
      } catch (error) {
        toast.error('Erreur lors de la déconnexion');
      }
    }
  }, [toast]);

  const openNewMissionModal = (dateStr?: string) => {
    setEditingMission(null);
    setSelectedDateForNew(dateStr);
    setIsModalOpen(true);
  };

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
    <div className="min-h-screen bg-dark-300 text-gray-100 font-sans selection:bg-primary-500 selection:text-dark-300 antialiased relative z-10">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-strong border-r border-primary-500/30 fixed inset-y-0 z-20">
        <div className="p-6 border-b border-primary-700/20 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 shadow-md items-center justify-center">
            <span className="text-2xl font-black text-white tracking-tight">N</span>
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-primary-300 leading-tight">NeuroTime</h1>
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
        </nav>

        <div className="p-4 space-y-2 border-t border-primary-500/20">
           <button 
            onClick={() => setIsImportModalOpen(true)}
            className="w-full glass-button text-primary-300 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Sparkles size={16} />
            <span>Scanner IA</span>
          </button>
           <button 
            onClick={() => openNewMissionModal()}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-dark-300 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 glow-blue transition-all text-sm"
          >
            <Plus size={18} />
            <span>Nouvelle mission</span>
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
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 bg-dark-300">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-primary-500/30 z-30 pb-safe">
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
              className="bg-gradient-to-br from-primary-500 to-primary-600 text-dark-300 p-3.5 rounded-full glow-blue-strong transform active:scale-90 transition-all ring-4 ring-dark-50"
              aria-label="Nouvelle mission"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>

           <MobileNavButton 
            active={false}
            onClick={() => setIsImportModalOpen(true)}
            icon={<Sparkles size={22} />} 
            label="Scan IA"
          />

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

        <ImageImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleBulkAddMissions}
        />
      </Suspense>

      <AuthModal 
        isOpen={isAuthModalOpen && !user} 
        onClose={() => {}} 
        onSuccess={handleAuthSuccess}
        initialMode="login"
      />
      
      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 z-40 glass-card px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-400">
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
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
      active 
        ? 'glass-button text-primary-300 font-semibold glow-blue' 
        : 'text-gray-400 hover:glass-button hover:text-primary-300'
    }`}
  >
    {icon}
    <span>{label}</span>
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