import React, { useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Plus, ListChecks, LogOut, User, Euro, Eye, EyeOff, Menu, ChevronLeft, Pin, PinOff, BarChart3, Calculator } from 'lucide-react';
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
const UrssafView = lazy(() => import('./components/UrssafView'));

import AuthModal from './components/AuthModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import SplashScreen from './components/SplashScreen';
import { Mission } from './types';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { missions, isLoading, isSaving, addMission, updateMission, deleteMission, importMissions } = useMissions();

  const navigate = useNavigate();
  const location = useLocation();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

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
          onClose={() => { }} // Can't close
          onSuccess={handleAuthSuccess}
          initialMode="login"
        />
      </div>
    );
  }

  const currentView = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

  return (
    <div className="min-h-screen neo-aurora text-gray-100 font-sans selection:bg-primary-500 selection:text-dark-300 antialiased relative z-10 overflow-y-auto">
      {/* Notifications */}
      <Toaster position="top-right" theme="dark" />

      {/* Decorative Aurora Layer */}
      <div className="aurora-layer pointer-events-none select-none">
        <div className="aurora-blob primary" style={{ top: '-120px', left: '-60px' }} />
        <div className="aurora-blob pink" style={{ top: '-80px', right: '-100px' }} />
        <div className="aurora-blob teal small" style={{ bottom: '-120px', left: '20%' }} />
      </div>

      {/* Desktop Sidebar Opener */}
      {!sidebarPinned && (
        <div
          className="hidden md:block fixed inset-y-0 left-0 z-20 w-4 h-full group"
          onMouseEnter={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col w-64 border-r border-white/5 fixed inset-y-0 z-20 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[#0a0f18]/95 backdrop-blur-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onMouseLeave={() => { if (!sidebarPinned) setIsSidebarOpen(false) }}
      >
        <div className="p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <img src="/logo.png" alt="Logo NeuroTime" className="h-8 w-auto object-contain object-left mb-1.5" />
              <span className="text-[9px] text-primary-400 font-black uppercase tracking-[0.2em] leading-none">
                Freelance Platform
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSidebarPinned}
              className={`p-1.5 rounded-lg transition-all ${sidebarPinned ? 'text-primary-400 bg-primary-500/10' : 'text-gray-600 hover:text-white'}`}
            >
              {sidebarPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar" aria-label="Navigation principale">
          <div className="px-3 mb-2">
            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Navigation</span>
          </div>
          <NavButton
            active={location.pathname === '/'}
            onClick={() => { navigate('/'); setIsSidebarOpen(false) }}
            icon={<LayoutDashboard size={16} />}
            label="Tableau de bord"
          />
          <NavButton
            active={location.pathname === '/missions'}
            onClick={() => { navigate('/missions'); setIsSidebarOpen(false) }}
            icon={<ListChecks size={16} />}
            label="Missions"
          />
          <NavButton
            active={location.pathname === '/payments'}
            onClick={() => { navigate('/payments'); setIsSidebarOpen(false) }}
            icon={<Euro size={16} />}
            label="Paiements"
          />
          <NavButton
            active={location.pathname === '/stats'}
            onClick={() => { navigate('/stats'); setIsSidebarOpen(false) }}
            icon={<BarChart3 size={16} />}
            label="Analyses"
          />
          <NavButton
            active={location.pathname === '/urssaf'}
            onClick={() => { navigate('/urssaf'); setIsSidebarOpen(false) }}
            icon={<Calculator size={16} />}
            label="URSSAF"
          />
        </nav>

        <div className="p-3 space-y-3">
          <button
            onClick={() => { openNewMissionModal(); setIsSidebarOpen(false) }}
            className="w-full bg-white text-black font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="text-[10px] uppercase tracking-wider font-extrabold">Nouvelle mission</span>
          </button>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-[10px] font-black text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#0a0f18] rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-white truncate leading-none mb-1">{user.email?.split('@')[0]}</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Session Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                onClick={toggleHidePrices}
                className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg border transition-all ${hidePrices ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
              >
                {hidePrices ? <EyeOff size={12} /> : <Eye size={12} />}
                <span className="text-[7px] font-black uppercase">Tarifs</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg bg-white/5 border border-white/5 text-gray-500 hover:text-red-400 transition-all"
              >
                <LogOut size={12} />
                <span className="text-[7px] font-black uppercase">Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 glass-strong border-b border-gray-700/30 z-30 pb-safe backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo NeuroTime" className="h-8 object-contain" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium">
                {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
          <button
            onClick={toggleHidePrices}
            className={`flex items-center justify-center p-2.5 rounded-lg transition-all ${hidePrices ? 'text-orange-400 bg-orange-500/20' : 'text-gray-300 bg-gray-700/30'}`}
            aria-pressed={hidePrices}
          >
            {hidePrices ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`min-h-screen pb-20 md:pb-0 bg-transparent overflow-y-auto relative pt-16 md:pt-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in relative">
          {/* Sidebar Toggle Button (Desktop) */}
          <div className="hidden md:block absolute top-4 left-4 z-10 opacity-50 hover:opacity-100 transition-opacity">
            {!sidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 glass-button rounded-lg text-gray-400 hover:text-white"
                aria-label="Ouvrir la navigation"
              >
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
              <Route path="/urssaf" element={
                <UrssafView
                  missions={missions}
                  hidePrices={hidePrices}
                />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe" aria-label="Navigation mobile">
        {/* Background - Ultra premium glassmorphism */}
        <div className="absolute inset-0 bg-dark-200/90 backdrop-blur-2xl border-t border-white/5 shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.6)]" />

        {/* Laser Glow Line - Animated */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/60 to-transparent opacity-80 shadow-[0_0_12px_rgba(0,140,255,0.8)]" />

        <div className="relative flex justify-around items-end px-1 pb-2 pt-3">
          <MobileNavButton
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
            icon={<LayoutDashboard size={20} className={location.pathname === '/' ? "stroke-[2.5px] drop-shadow-md" : "stroke-2"} />}
            label="ACCUEIL"
          />
          <MobileNavButton
            active={location.pathname === '/missions'}
            onClick={() => navigate('/missions')}
            icon={<ListChecks size={20} className={location.pathname === '/missions' ? "stroke-[2.5px] drop-shadow-md" : "stroke-2"} />}
            label="MISSIONS"
          />

          {/* Advanced Hybrid FAB */}
          <div className="relative -top-6 flex items-center justify-center pointer-events-none group">
            <div className="pointer-events-auto relative">
              {/* External Glow Ring - Ripple effect */}
              <div className="absolute inset-[-4px] bg-primary-500/20 rounded-full animate-ping opacity-20 duration-[3000ms]" />
              <div className="absolute inset-[-1px] rounded-full bg-gradient-to-br from-primary-400 to-primary-600 opacity-60 blur-sm" />

              <button
                onClick={() => openNewMissionModal()}
                className="relative bg-gradient-to-br from-primary-450 to-primary-600 active:from-primary-500 active:to-primary-700 text-white p-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_16px_rgba(0,120,255,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-dark-200"
                aria-label="Ajouter une mission"
              >
                <Plus size={24} strokeWidth={3} className="drop-shadow-lg" />
              </button>
            </div>
          </div>

          <MobileNavButton
            active={location.pathname === '/payments'}
            onClick={() => navigate('/payments')}
            icon={<Euro size={20} className={location.pathname === '/payments' ? "stroke-[2.5px] drop-shadow-md" : "stroke-2"} />}
            label="PAIEMENTS"
          />
          <MobileNavButton
            active={location.pathname === '/stats'}
            onClick={() => navigate('/stats')}
            icon={<BarChart3 size={20} className={location.pathname === '/stats' ? "stroke-[2.5px] drop-shadow-md" : "stroke-2"} />}
            label="STATS"
          />
        </div>
      </nav>

      {/* Modale de mission */}
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

      {/* PWA Prompt */}
      <PWAInstallPrompt />

      {/* Modale de confirmation / autres overlays */}
      {confirmDialog}

      {/* Snackbar de sauvegarde */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 z-40 glass-card px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" aria-hidden />
          <span>Sauvegarde...</span>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative ${active
      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[0_0_20px_-5px_rgba(14,165,233,0.3)]'
      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
      }`}
  >
    <span className={`transition-all duration-200 ${active ? 'scale-110' : 'group-hover:translate-x-0.5'}`}>
      {icon}
    </span>
    <span className={`text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-200 ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 min-w-[64px] relative group ${active
      ? 'text-white'
      : 'text-gray-500 active:text-primary-400'
      }`}
  >
    {active && (
      <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm animate-pulse" />
    )}

    {/* Icône */}
    <span className={`relative z-10 transition-all duration-300 transform ${active
      ? '-translate-y-1 text-primary-400'
      : 'translate-y-0 group-active:scale-90'
      }`}>
      {icon}
    </span>

    {/* Label */}
    {label && (
      <span className={`relative z-10 text-[9px] font-black tracking-[0.15em] transition-all duration-300 uppercase mt-1 ${active
        ? 'opacity-100 transform translate-y-0 text-white'
        : 'opacity-0 transform translate-y-2 h-0 overflow-hidden'
        }`}>
        {label}
      </span>
    )}
  </button>
);

export default App;