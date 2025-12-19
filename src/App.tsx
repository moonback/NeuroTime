import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Plus, ListChecks, LogOut, User, Euro, Eye, EyeOff, Menu, ChevronLeft, Pin, PinOff, BarChart3, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { usePreferences } from './hooks/usePreferences';
import { useAuth } from './context/AuthContext';
import { useMissions } from './context/MissionContext';
import { useConfirmDialog } from './hooks/useConfirmDialog';

// Lazy loading
const Dashboard = lazy(() => import('./components/Dashboard'));
const MissionsList = lazy(() => import('./components/MissionsList'));
const PaymentsView = lazy(() => import('./components/PaymentsView'));
const MissionForm = lazy(() => import('./components/MissionForm'));
const StatsView = lazy(() => import('./components/StatsView'));

import AuthModal from './components/AuthModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import SplashScreen from './components/SplashScreen';
import { Mission } from './types';
import { NetworkStatusBadge } from './components/NetworkStatusBadge';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './context/ThemeContext';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { missions, isLoading, isSaving, addMission, updateMission, deleteMission, importMissions } = useMissions();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { theme } = useTheme();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Préférences
  const { hidePrices, toggleHidePrices, sidebarPinned, toggleSidebarPinned } = usePreferences();
  const sidebarOpen = sidebarPinned || isSidebarOpen;

  // Handlers
  const handleSaveMission = useCallback((mission: Mission) => {
    if (editingMission) {
      updateMission(mission);
    } else {
      addMission(mission);
    }
    setEditingMission(null);
    setIsModalOpen(false);
  }, [editingMission, updateMission, addMission]);

  const handleEditMission = (mission: Mission) => {
    if (mission.isPaid) {
      toast.warning('Cette mission a été payée et ne peut plus être modifiée.');
      return;
    }
    setEditingMission(mission);
    setSelectedDateForNew(undefined);
    setIsModalOpen(true);
  };

  const handleValidateMission = (mission: Mission) => {
    if (mission.isPaid) {
      toast.warning('Cette mission a été payée et ne peut plus être modifiée.');
      return;
    }
    const missionToValidate = { ...mission, status: 'completed' as const };
    setEditingMission(missionToValidate);
    setSelectedDateForNew(undefined);
    setIsModalOpen(true);
  };

  const handleCompleteMission = useCallback(async (mission: Mission) => {
    const ok = await confirm({
      title: 'Marquer la mission comme terminée ?',
      description: `“${mission.title}” passera en statut terminé.`,
      confirmText: 'Terminer',
      cancelText: 'Annuler',
    });
    if (!ok) return;
    updateMission({ ...mission, status: 'completed' });
  }, [confirm, updateMission]);

  const handleDeleteMission = useCallback(async (id: string) => {
    const mission = missions.find(m => m.id === id);
    if (mission?.isPaid) {
      toast.warning('Cette mission a été payée et ne peut plus être supprimée.');
      return;
    }
    const ok = await confirm({
      title: 'Supprimer cette mission ?',
      description: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;
    deleteMission(id);
  }, [missions, confirm, deleteMission]);

  const handleTogglePaid = useCallback((mission: Mission) => {
    updateMission({ ...mission, isPaid: !mission.isPaid });
  }, [updateMission]);

  const handleImportData = useCallback(async (importedMissions: Mission[]) => {
    const ok = await confirm({
      title: 'Remplacer vos données par l’import ?',
      description: `Vos ${missions.length} missions actuelles seront remplacées par ${importedMissions.length} missions importées.`,
      confirmText: 'Importer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;
    importMissions(importedMissions);
    toast.success('Import terminé.');
  }, [confirm, missions.length, importMissions]);

  const handleSignOut = useCallback(async () => {
    const ok = await confirm({
      title: 'Se déconnecter ?',
      description: 'Vous pourrez vous reconnecter à tout moment.',
      confirmText: 'Déconnexion',
      cancelText: 'Annuler',
    });
    if (!ok) return;
    await signOut();
  }, [confirm, signOut]);

  const openNewMissionModal = (dateStr?: string) => {
    setEditingMission(null);
    setSelectedDateForNew(dateStr);
    setIsModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  // Splash screen
  if (showSplash) {
    return (
      <SplashScreen 
        onFinish={() => setShowSplash(false)}
        minDisplayTime={1500}
        ready={!authLoading}
      />
    );
  }

  if (authLoading) {
    return <LoadingSpinner fullScreen text="Chargement..." />;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen neo-aurora flex items-center justify-center relative overflow-hidden">
        <Toaster position="top-center" theme="dark" />
        <div className="aurora-layer">
          <div className="aurora-blob primary" style={{ top: '-10%', left: '-10%' }} />
          <div className="aurora-blob pink" style={{ top: '20%', right: '-10%' }} />
          <div className="aurora-blob teal small" style={{ bottom: '-10%', left: '20%' }} />
        </div>
        
        <AuthModal 
          isOpen={true} // Always open if not user
          onClose={() => {}} // Can't close
          onSuccess={handleAuthSuccess}
          initialMode="login"
        />
      </div>
    );
  }

  const currentView = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

  return (
    <div className="min-h-screen neo-aurora text-gray-100 font-sans selection:bg-primary-500 selection:text-dark-300 antialiased relative z-10 overflow-y-auto">
      <Toaster position="top-right" theme="dark" />
      <div className="aurora-layer">
        <div className="aurora-blob primary" style={{ top: '-120px', left: '-60px' }} />
        <div className="aurora-blob pink" style={{ top: '-80px', right: '-100px' }} />
        <div className="aurora-blob teal small" style={{ bottom: '-120px', left: '20%' }} />
      </div>

      {/* Sidebar Desktop */}
      {!sidebarPinned && (
        <div
          className="hidden md:block fixed inset-y-0 left-0 z-20 w-4 h-full group"
          onMouseEnter={() => setIsSidebarOpen(true)}
        />
      )}

      <aside 
        className={`hidden md:flex flex-col w-64 glass-strong border-r border-gray-700/30 fixed inset-y-0 z-20 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseLeave={() => { if (!sidebarPinned) setIsSidebarOpen(false); }}
      >
        <div className="p-6 border-b border-gray-700/30 flex flex-col gap-3">
          <div className="flex justify-between items-center gap-3">
            <div className="w-full rounded-2xl shadow-lg backdrop-blur-xl overflow-hidden p-2 glass-light">
              <img 
                src={theme === 'dark' ? "/logo.png" : "/logo-light.png"} 
                alt="Logo" 
                className="w-full h-20 object-contain" 
              />
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleSidebarPinned}
                className={`p-2 glass-button rounded-lg ${sidebarPinned ? 'text-primary-300' : 'text-gray-400 hover:text-gray-100'}`}
                title={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
              >
                {sidebarPinned ? <Pin size={20} className="fill-current" /> : <PinOff size={20} />}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="md:hidden p-2 text-gray-400 hover:text-gray-100"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-400 font-medium">
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <NavButton 
            active={location.pathname === '/'} 
            onClick={() => { navigate('/'); setIsSidebarOpen(false); }} 
            icon={<LayoutDashboard size={19} />} 
            label="Tableau de bord" 
          />
          <NavButton 
            active={location.pathname === '/missions'} 
            onClick={() => { navigate('/missions'); setIsSidebarOpen(false); }} 
            icon={<ListChecks size={19} />} 
            label="Missions" 
          />
          <NavButton 
            active={location.pathname === '/payments'} 
            onClick={() => { navigate('/payments'); setIsSidebarOpen(false); }} 
            icon={<Euro size={19} />} 
            label="Paiements" 
          />
          <NavButton 
            active={location.pathname === '/stats'} 
            onClick={() => { navigate('/stats'); setIsSidebarOpen(false); }} 
            icon={<BarChart3 size={19} />} 
            label="Statistiques" 
          />
        </nav>

        <div className="p-4 space-y-3 border-t border-gray-700/30">
           <button
            onClick={() => { openNewMissionModal(); setIsSidebarOpen(false); }}
            className="w-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md"
          >
            <Plus size={18} strokeWidth={2.3} />
            <span className="tracking-wide font-medium">Nouvelle mission</span>
          </button>
          
          <div className="pt-2 border-t border-gray-700/30 mt-2">
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-3 text-xs glass-light rounded-lg border border-gray-700/30">
              <div className="p-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30">
                <User size={12} className="text-primary-400" />
              </div>
              <span className="truncate text-gray-200 font-medium">{user.email}</span>
            </div>
            <button 
              onClick={toggleHidePrices}
              className="w-full glass-button hover:bg-orange-500/10 text-gray-300 hover:text-orange-400 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 mb-2 text-sm"
            >
              {hidePrices ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{hidePrices ? 'Afficher tarifs' : 'Masquer tarifs'}</span>
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full glass-button hover:bg-red-500/10 text-gray-300 hover:text-red-400 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm"
            >
              <LogOut size={14} />
              <span>Déconnexion</span>
            </button>
            
            <div className="flex justify-center mt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 glass-strong border-b border-gray-700/30 z-30 pb-safe backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img 
              src={theme === 'dark' ? "/logo.png" : "/logo-light.png"} 
              alt="Logo" 
              className="h-8 object-contain" 
            />
            <div className="flex flex-col">
              {/* <span className="text-lg font-bold text-gray-100">NeuroTime</span> */}
              <span className="text-xs text-gray-400 font-medium">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
          <button 
            onClick={toggleHidePrices}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-all ${hidePrices ? 'text-orange-400 bg-orange-500/20' : 'text-gray-300 bg-gray-700/30'}`}
          >
            {hidePrices ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`min-h-screen pb-20 md:pb-0 bg-transparent overflow-y-auto relative pt-16 md:pt-0 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in relative">
          
          <div className="hidden md:block absolute top-4 left-4 z-10 opacity-50 hover:opacity-100 transition-opacity">
             {!sidebarOpen && (
               <button onClick={() => setIsSidebarOpen(true)} className="p-2 glass-button rounded-lg text-gray-400 hover:text-gray-100" aria-label="Ouvrir la sidebar">
                 <Menu size={24} />
               </button>
             )}
          </div>

          <Suspense fallback={<LoadingSpinner fullScreen text="Chargement..." />}>
            <Routes>
              <Route path="/" element={
                <Dashboard 
                  missions={missions} 
                  onEdit={handleEditMission} 
                  onValidate={handleValidateMission}
                  onImport={handleImportData}
                  hidePrices={hidePrices}
                />
              } />
              <Route path="/stats" element={
                <StatsView 
                  missions={missions}
                  hidePrices={hidePrices}
                />
              } />
              <Route path="/missions" element={
                <MissionsList 
                  missions={missions} 
                  onEdit={handleEditMission} 
                  onDelete={handleDeleteMission} 
                  onNew={() => openNewMissionModal()}
                  onTogglePaid={handleTogglePaid}
                  onComplete={handleCompleteMission}
                  hidePrices={hidePrices}
                />
              } />
              <Route path="/payments" element={
                <PaymentsView 
                  missions={missions} 
                  onTogglePaid={handleTogglePaid}
                  hidePrices={hidePrices}
                />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-gray-700/30 z-30 pb-safe animate-slide-up shadow-lg backdrop-blur-xl">
        <div className="flex justify-around items-center px-3 py-2.5">
          <MobileNavButton 
            active={location.pathname === '/'} 
            onClick={() => navigate('/')} 
            icon={<LayoutDashboard size={22} />} 
            label="Accueil"
          />
          <MobileNavButton 
            active={location.pathname === '/missions'} 
            onClick={() => navigate('/missions')} 
            icon={<ListChecks size={22} />} 
            label="Missions"
          />
          <div className="relative -top-8">
            <button 
              onClick={() => openNewMissionModal()}
              className="bg-primary-500 hover:bg-primary-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
          <MobileNavButton 
            active={location.pathname === '/payments'} 
            onClick={() => navigate('/payments')} 
            icon={<Euro size={22} />} 
            label="Paiements"
          />
          <MobileNavButton 
            active={location.pathname === '/stats'} 
            onClick={() => navigate('/stats')} 
            icon={<BarChart3 size={22} />} 
            label="Stats"
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
      
      <PWAInstallPrompt />
      <NetworkStatusBadge />
      {confirmDialog}
      
      {isSaving && (
        <div className="fixed bottom-4 right-4 z-40 glass-card px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Sauvegarde...</span>
        </div>
      )}
    </div>
  );
};

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