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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Toujours ouvert par défaut sur desktop
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
    <div className="min-h-screen min-h-[100dvh] neo-aurora text-[var(--text-primary)] font-sans antialiased relative z-10 overflow-y-auto">
      {/* Notifications */}
      <Toaster position="top-right" theme="dark" richColors />

      {/* Decorative Aurora Layer */}
      <div className="aurora-layer pointer-events-none select-none">
        <div className="aurora-blob primary" style={{ top: '-100px', left: '-40px' }} />
        <div className="aurora-blob pink" style={{ top: '-60px', right: '-80px' }} />
        <div className="aurora-blob teal small" style={{ bottom: '-80px', left: '25%' }} />
      </div>

      {/* Desktop Sidebar Opener - Only show when sidebar is closed */}
      {!sidebarOpen && (
        <div
          className="hidden md:block fixed inset-y-0 left-0 z-20 w-2 h-full hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
          onMouseEnter={() => setIsSidebarOpen(true)}
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar — ENHANCED MINIMAL — Always visible on desktop */}
      <aside
        className={`hidden md:flex flex-col w-56 border-r border-[var(--border-subtle)] fixed inset-y-0 z-20 transition-all duration-200 ease-out bg-[var(--bg-secondary)]/95 backdrop-blur-sm ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onMouseLeave={() => { if (!sidebarPinned) setIsSidebarOpen(false) }}
      >
        {/* Header avec gradient subtil */}
        <div className="px-4 py-4 flex flex-col gap-3 border-b border-[var(--border-subtle)]">
          <div className="flex justify-between items-center">
            <div className="flex flex-col group">
              <img src="/logo.png" alt="Logo NeuroTime" className="h-7 w-auto object-contain object-left" />
              <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-[0.14em] leading-none">
                Freelance Platform
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSidebarPinned}
                className={`p-2 rounded-lg transition-all ${sidebarPinned ? 'text-[var(--accent)] bg-[var(--primary-light)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]'}`}
                title={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
              >
                {sidebarPinned ? <PinOff size={12} /> : <Pin size={12} />}
              </button>
              {!sidebarPinned && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]"
                  title="Fermer la sidebar"
                >
                  <ChevronLeft size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation avec indicateurs améliorés */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar" aria-label="Navigation principale">
          <div className="px-2 mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
            <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-[0.14em]">Menu</span>
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-default)] via-transparent to-transparent" />
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
            badge={missions.filter(m => m.status === 'planned').length}
          />
          <NavButton
            active={location.pathname === '/payments'}
            onClick={() => { navigate('/payments'); setIsSidebarOpen(false) }}
            icon={<Euro size={14} />}
            label="Paiements"
            badge={missions.filter(m => m.status === 'completed' && !m.isPaid).length}
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

        {/* Footer avec CTA et profil améliorés */}
        <div className="p-3 space-y-3 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => { openNewMissionModal(); setIsSidebarOpen(false) }}
            className="w-full btn-primary px-3 py-2 text-[11px] uppercase tracking-[0.12em]"
          >
            <Plus size={14} strokeWidth={2.5} className="" />
            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold">Nouvelle mission</span>
          </button>

          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative group/avatar">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[12px] font-bold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate leading-none mb-1">{user.email?.split('@')[0]}</span>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium text-left"
                >
                  Voir Profil →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={toggleHidePrices}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all text-[9px] font-semibold uppercase ${hidePrices ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-sm shadow-orange-500/10' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'}`}
                title={hidePrices ? 'Afficher les tarifs' : 'Masquer les tarifs'}
              >
                {hidePrices ? <EyeOff size={11} /> : <Eye size={11} />}
                <span className="leading-none">{hidePrices ? 'Masqué' : 'Visible'}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-white/[0.025] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-all text-[9px] font-semibold uppercase"
                title="Se déconnecter"
              >
                <LogOut size={11} />
                <span className="leading-none">Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header — ENHANCED */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 pb-safe backdrop-blur-md">
        <div className="bg-[var(--bg-secondary)]/95 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative group">
                <img src="/logo.png" alt="Logo NeuroTime" className="h-6 object-contain" />
                <div className="hidden" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[var(--text-primary)] font-semibold leading-none mb-1">
                  {format(new Date(), 'EEEE', { locale: fr })}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium leading-none">
                  {format(new Date(), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleHidePrices}
                className={`flex items-center justify-center p-2 rounded-lg transition-all active:scale-95 ${hidePrices ? 'text-orange-400 bg-orange-500/10 border border-orange-500/20' : 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]'}`}
                aria-pressed={hidePrices}
                title={hidePrices ? 'Afficher les tarifs' : 'Masquer les tarifs'}
              >
                {hidePrices ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — ENHANCED DESKTOP LAYOUT */}
      <main className={`min-h-screen min-h-[100dvh] pb-14 md:pb-0 bg-transparent overflow-y-auto relative pt-[44px] md:pt-0 transition-all duration-300 ease-out ${sidebarOpen ? 'md:ml-56' : 'md:ml-0'}`}>
        {/* Sidebar Toggle Button (Desktop) - Only visible when closed */}
        {!sidebarOpen && (
          <div className="hidden md:block fixed top-4 left-4 z-10">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 glass-button rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              aria-label="Ouvrir la navigation"
              title="Ouvrir la sidebar"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        <Suspense fallback={<LoadingSpinner fullScreen text="Chargement..." />}>
          <div
            key={location.key}
            className="px-4 py-5 md:p-8 lg:p-10 max-w-[1440px] mx-auto animate-slide-in-up relative"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe px-3 pb-3" aria-label="Navigation mobile">
        <div className="absolute inset-x-3 bottom-3 top-0 bg-[var(--bg-secondary)]/95 border border-[var(--border-subtle)] rounded-2xl" />

        <div className="relative flex justify-around items-center px-1.5 py-1.5">
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
              className="relative bg-[var(--accent)] active:bg-[var(--accent-hover)] text-white p-3 rounded-xl active:scale-95 transition-all duration-150 ring-[4px] ring-[var(--bg-primary)]"
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
        <div className="fixed bottom-20 md:bottom-4 right-4 z-40 glass-card px-3 py-2 rounded-xl flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-medium">
          <div className="w-2 h-2 border border-[var(--primary)] border-t-transparent rounded-full animate-spin" aria-hidden />
          <span>Sauvegarde…</span>
        </div>
      )}
    </div>
  );
};

/* ============================================
   NAV BUTTONS - Enhanced with badges & hover effects
   ============================================ */

const NavButton = ({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative border ${active
      ? 'bg-white/[0.055] text-[var(--text-primary)] border-[var(--border-default)]'
      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.035] border-transparent'
      }`}
  >
    {active && (
      <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--accent)] rounded-full" />
    )}

    <span className={active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}>
      {icon}
    </span>
    <span className="text-[12px] font-semibold tracking-[-0.01em] flex-1 text-left">{label}</span>

    {badge !== undefined && badge > 0 && (
      <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[10px] font-semibold rounded-full">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 min-w-[56px] relative ${active
      ? 'text-[var(--accent)] bg-white/[0.045]'
      : 'text-[var(--text-muted)] active:text-[var(--accent)] active:scale-95'
      }`}
  >
    <span>{icon}</span>
    {label && (
      <span className={`text-[9px] font-semibold tracking-[-0.01em] mt-1 ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        {label}
      </span>
    )}
  </button>
);

export default App;