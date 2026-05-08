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
const ProfileView = lazy(() => import('./components/ProfileView'));

import AuthModal from './components/AuthModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import SplashScreen from './components/SplashScreen';
import { Mission } from './types';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    missions,
    payments,
    isLoading,
    isSaving,
    addMission,
    updateMission,
    deleteMission,
    importMissions,
    addPayment,
    deletePayment
  } = useMissions();

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
      description: `"${mission.title}" passera en statut terminé.`,
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
      title: 'Remplacer vos données par l\'import ?',
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
      <div className="min-h-screen min-h-[100dvh] neo-aurora flex items-center justify-center relative overflow-hidden">
        <Toaster position="top-center" theme="dark" richColors />
        <div className="aurora-layer">
          <div className="aurora-blob primary" style={{ top: '-10%', left: '-10%' }} />
          <div className="aurora-blob pink" style={{ top: '20%', right: '-10%' }} />
          <div className="aurora-blob teal small" style={{ bottom: '-10%', left: '20%' }} />
        </div>

        <AuthModal
          isOpen={true}
          onClose={() => { }}
          onSuccess={handleAuthSuccess}
          initialMode="login"
        />
      </div>
    );
  }

  const currentView = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

  return (
    <div className="min-h-screen min-h-[100dvh] neo-aurora text-gray-100 font-sans antialiased relative z-10 overflow-y-auto">
      {/* Notifications */}
      <Toaster position="top-right" theme="dark" richColors />

      {/* Decorative Aurora Layer */}
      <div className="aurora-layer pointer-events-none select-none">
        <div className="aurora-blob primary" style={{ top: '-100px', left: '-40px' }} />
        <div className="aurora-blob pink" style={{ top: '-60px', right: '-80px' }} />
        <div className="aurora-blob teal small" style={{ bottom: '-80px', left: '25%' }} />
      </div>

      {/* Desktop Sidebar Opener */}
      {!sidebarPinned && (
        <div
          className="hidden md:block fixed inset-y-0 left-0 z-20 w-3 h-full"
          onMouseEnter={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar — MINIMAL & COMPACT */}
      <aside
        className={`hidden md:flex flex-col w-52 border-r border-[var(--border-subtle)] fixed inset-y-0 z-20 transition-transform duration-300 ease-out bg-[var(--bg-secondary)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onMouseLeave={() => { if (!sidebarPinned) setIsSidebarOpen(false) }}
      >
        <div className="p-3 pb-2 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <img src="/logo.png" alt="Logo NeuroTime" className="h-6 w-auto object-contain object-left mb-0.5" />
              <span className="text-[7px] text-[var(--text-tertiary)] font-medium uppercase tracking-[0.15em] leading-none">
                Freelance Platform
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSidebarPinned}
              className={`p-1 rounded-md transition-all ${sidebarPinned ? 'text-[var(--primary)] bg-[var(--primary-light)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
            >
              {sidebarPinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar" aria-label="Navigation principale">
          <div className="px-2 mb-1">
            <span className="text-[7px] text-[var(--text-tertiary)] font-medium uppercase tracking-[0.1em]">Navigation</span>
          </div>
          <NavButton
            active={location.pathname === '/'}
            onClick={() => { navigate('/'); setIsSidebarOpen(false) }}
            icon={<LayoutDashboard size={14} />}
            label="Tableau de bord"
          />
          <NavButton
            active={location.pathname === '/missions'}
            onClick={() => { navigate('/missions'); setIsSidebarOpen(false) }}
            icon={<ListChecks size={14} />}
            label="Missions"
          />
          <NavButton
            active={location.pathname === '/payments'}
            onClick={() => { navigate('/payments'); setIsSidebarOpen(false) }}
            icon={<Euro size={14} />}
            label="Paiements"
          />
          <NavButton
            active={location.pathname === '/stats'}
            onClick={() => { navigate('/stats'); setIsSidebarOpen(false) }}
            icon={<BarChart3 size={14} />}
            label="Analyses"
          />
          <NavButton
            active={location.pathname === '/urssaf'}
            onClick={() => { navigate('/urssaf'); setIsSidebarOpen(false) }}
            icon={<Calculator size={14} />}
            label="URSSAF"
          />
          <NavButton
            active={location.pathname === '/profile'}
            onClick={() => { navigate('/profile'); setIsSidebarOpen(false) }}
            icon={<User size={14} />}
            label="Mon Profil"
          />
        </nav>

        <div className="p-2 space-y-2">
          <button
            onClick={() => { openNewMissionModal(); setIsSidebarOpen(false) }}
            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Nouvelle mission</span>
          </button>

          <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-6 h-6 rounded-md bg-[var(--primary)] flex items-center justify-center text-[9px] font-semibold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[var(--success)]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-medium text-[var(--text-primary)] truncate leading-none mb-0.5">{user.email?.split('@')[0]}</span>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-[7px] text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium uppercase tracking-wider text-left"
                >
                  Voir Profil
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={toggleHidePrices}
                className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-md border transition-all text-[7px] font-medium uppercase ${hidePrices ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
              >
                {hidePrices ? <EyeOff size={10} /> : <Eye size={10} />}
                <span>Tarifs</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-red-400 transition-all text-[7px] font-medium uppercase"
              >
                <LogOut size={10} />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header — MINIMAL */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 pb-safe">
        <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo NeuroTime" className="h-5 object-contain" />
              <span className="text-[9px] text-[var(--text-tertiary)] font-medium">
                {format(new Date(), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <button
              onClick={toggleHidePrices}
              className={`flex items-center justify-center p-1.5 rounded-md transition-all ${hidePrices ? 'text-orange-400 bg-orange-500/10' : 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]'}`}
              aria-pressed={hidePrices}
            >
              {hidePrices ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`min-h-screen min-h-[100dvh] pb-14 md:pb-0 bg-transparent overflow-y-auto relative pt-[44px] md:pt-0 transition-all duration-300 ease-out ${sidebarOpen ? 'md:ml-52' : 'md:ml-0'}`}>
        {/* Sidebar Toggle Button (Desktop) */}
        <div className="hidden md:block fixed top-2 left-2 z-10 opacity-40 hover:opacity-100 transition-opacity">
          {!sidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 glass-button rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              aria-label="Ouvrir la navigation"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        <Suspense fallback={<LoadingSpinner fullScreen text="Chargement..." />}>
          <div
            key={location.key}
            className="p-3 md:p-4 lg:p-5 max-w-7xl mx-auto animate-slide-in-up relative"
          >
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
                  payments={payments}
                  onTogglePaid={handleTogglePaid}
                  onAddPayment={addPayment}
                  onDeletePayment={deletePayment}
                  hidePrices={hidePrices}
                />
              } />
              <Route path="/urssaf" element={
                <UrssafView
                  missions={missions}
                  hidePrices={hidePrices}
                />
              } />
              <Route path="/profile" element={
                <ProfileView />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation — MINIMAL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe" aria-label="Navigation mobile">
        <div className="absolute inset-0 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]" />

        <div className="relative flex justify-around items-center px-1 py-1">
          <MobileNavButton
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
            icon={<LayoutDashboard size={18} />}
            label="Accueil"
          />
          <MobileNavButton
            active={location.pathname === '/missions'}
            onClick={() => navigate('/missions')}
            icon={<ListChecks size={18} />}
            label="Missions"
          />

          {/* Central FAB — Minimal */}
          <div className="relative -top-2 flex items-center justify-center">
            <button
              onClick={() => openNewMissionModal()}
              className="relative bg-[var(--primary)] active:bg-[var(--primary-hover)] text-white p-2.5 rounded-xl active:scale-95 transition-all duration-150 ring-[3px] ring-[var(--bg-secondary)]"
              aria-label="Ajouter une mission"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>

          <MobileNavButton
            active={location.pathname === '/payments'}
            onClick={() => navigate('/payments')}
            icon={<Euro size={18} />}
            label="Paiements"
          />
          <MobileNavButton
            active={location.pathname === '/profile'}
            onClick={() => navigate('/profile')}
            icon={<User size={18} />}
            label="Profil"
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

      {/* Modale de confirmation */}
      {confirmDialog}

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-16 md:bottom-3 right-3 z-40 glass-card px-2 py-1 rounded-md flex items-center gap-1.5 text-[9px] text-[var(--text-secondary)] font-medium">
          <div className="w-2 h-2 border border-[var(--primary)] border-t-transparent rounded-full animate-spin" aria-hidden />
          <span>Sauvegarde…</span>
        </div>
      )}
    </div>
  );
};

/* ============================================
   NAV BUTTONS - Minimal & Clean
   ============================================ */

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full group flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-150 ${active
      ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20'
      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
      }`}
  >
    <span className={`transition-transform duration-150 ${active ? 'scale-105' : ''}`}>
      {icon}
    </span>
    <span className={`text-[9px] font-medium tracking-wide ${active ? 'font-semibold' : ''}`}>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-1 px-1 rounded-md transition-all duration-150 min-w-[48px] ${active
      ? 'text-[var(--primary)]'
      : 'text-[var(--text-tertiary)] active:text-[var(--primary)]'
      }`}
  >
    {active && (
      <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-[var(--primary)]" />
    )}

    <span className="relative z-10">
      {icon}
    </span>

    {label && (
      <span className={`relative z-10 text-[7px] font-medium tracking-wider mt-0.5 ${active
        ? 'text-[var(--primary)]'
        : 'text-[var(--text-tertiary)]'
        }`}>
        {label}
      </span>
    )}
  </button>
);

export default App;