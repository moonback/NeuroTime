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
          className="hidden md:block fixed inset-y-0 left-0 z-20 w-3 h-full hover:bg-[var(--primary)]/5 transition-colors cursor-pointer"
          onMouseEnter={() => setIsSidebarOpen(true)}
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar — ENHANCED MINIMAL — Always visible on desktop */}
      <aside
        className={`hidden md:flex flex-col w-52 border-r border-[var(--border-default)] fixed inset-y-0 z-20 transition-all duration-300 ease-out glass shadow-2xl ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black/20' : '-translate-x-full'
          }`}
        onMouseLeave={() => { if (!sidebarPinned) setIsSidebarOpen(false) }}
      >
        {/* Header avec gradient subtil */}
        <div className="p-3 pb-2 flex flex-col gap-2 border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)]/30 to-transparent">
          <div className="flex justify-between items-center">
            <div className="flex flex-col group">
              <img src="/logo.png" alt="Logo NeuroTime" className="h-6 w-auto object-contain object-left mb-0.5 transition-transform group-hover:scale-105" />
              <span className="text-[7px] text-[var(--text-tertiary)] font-medium uppercase tracking-[0.15em] leading-none">
                Freelance Platform
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSidebarPinned}
                className={`p-1.5 rounded-[var(--radius-md)] transition-all duration-[var(--dur-fast)] hover:scale-110 active:scale-95 ${sidebarPinned ? 'text-[var(--primary)] bg-[var(--primary-light)] shadow-sm shadow-[var(--primary)]/20' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                title={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
                aria-label={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
              >
                {sidebarPinned ? <PinOff size={12} /> : <Pin size={12} />}
              </button>
              {!sidebarPinned && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-[var(--radius-md)] transition-all duration-[var(--dur-fast)] hover:scale-110 active:scale-95 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                  title="Fermer la sidebar"
                  aria-label="Fermer la sidebar"
                >
                  <ChevronLeft size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation avec indicateurs améliorés */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto custom-scrollbar" aria-label="Navigation principale">
          <div className="px-2 mb-2 flex items-center gap-1.5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
            <span className="text-[7px] text-[var(--text-tertiary)] font-medium uppercase tracking-[0.1em]">Menu</span>
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
        <div className="p-2 space-y-2 border-t border-[var(--border-subtle)] bg-gradient-to-t from-[var(--bg-elevated)]/30 to-transparent">
          <button
            onClick={() => { openNewMissionModal(); setIsSidebarOpen(false) }}
            className="shimmer-btn relative overflow-hidden w-full bg-gradient-to-r from-[var(--primary)] to-[#7c3aed] hover:shadow-lg hover:shadow-[var(--primary-glow)] text-white font-medium py-2 px-2.5 rounded-[var(--radius-md)] flex items-center justify-center gap-1.5 transition-all duration-[var(--dur-fast)] active:scale-[0.98] hover:scale-[1.02] group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Plus size={14} strokeWidth={2.5} className="relative z-10" />
            <span className="text-[9px] uppercase tracking-wider font-semibold relative z-10">Nouvelle mission</span>
          </button>

          <div className="glass p-2 rounded-[var(--radius-lg)] space-y-2 hover:border-[var(--border-strong)] transition-all duration-[var(--dur-fast)]">
            <div className="flex items-center gap-2">
              <div className="relative group/avatar">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform group-hover/avatar:scale-110">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] font-semibold text-[var(--text-primary)] truncate leading-none mb-1">{user.email?.split('@')[0]}</span>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-[7px] text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium uppercase tracking-wider text-left hover:underline underline-offset-2"
                >
                  Voir Profil →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={toggleHidePrices}
                className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-[var(--radius-md)] border transition-all text-[7px] font-medium uppercase hover:scale-105 ${hidePrices ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] shadow-sm shadow-[var(--primary-glow)]' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'}`}
                title={hidePrices ? 'Afficher les tarifs' : 'Masquer les tarifs'}
                aria-label={hidePrices ? 'Afficher les tarifs' : 'Masquer les tarifs'}
              >
                {hidePrices ? <EyeOff size={11} /> : <Eye size={11} />}
                <span className="leading-none">{hidePrices ? 'Masqué' : 'Visible'}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:border-[var(--danger)] hover:bg-[var(--danger-light)] transition-all text-[7px] font-medium uppercase hover:scale-105"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut size={11} />
                <span className="leading-none">Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header — ENHANCED */}
      <header className="md:hidden sticky top-0 left-0 right-0 z-40 pb-safe glass border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="relative group">
                <img src="/logo.png" alt="Logo NeuroTime" className="h-5 object-contain hover:scale-110 transition-transform duration-[var(--dur-fast)]" />
                <div className="absolute -inset-1 bg-[var(--primary)]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-primary)] font-semibold leading-none mb-0.5">
                  {format(new Date(), 'EEEE', { locale: fr })}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] font-medium leading-none">
                  {format(new Date(), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleHidePrices}
                className={`flex items-center justify-center p-2 rounded-lg transition-all active:scale-95 ${hidePrices ? 'text-[var(--primary)] bg-[var(--primary-light)] border border-[var(--primary)]' : 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] hover:border-[var(--border-strong)]'}`}
                aria-pressed={hidePrices}
                title={hidePrices ? 'Afficher les tarifs' : 'Masquer les tarifs'}
                aria-label={hidePrices ? 'Afficher les tarifs' : 'Masquer les tarifs'}
              >
                {hidePrices ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content — ENHANCED DESKTOP LAYOUT */}
      <main className={`min-h-screen min-h-[100dvh] pb-14 md:pb-0 bg-transparent overflow-y-auto relative pt-0 md:pt-0 transition-all duration-300 ease-out ${sidebarOpen ? 'md:ml-52' : 'md:ml-0'}`}>
        {/* Sidebar Toggle Button (Desktop) - Only visible when closed */}
        {!sidebarOpen && (
          <div className="hidden md:block fixed top-4 left-4 z-10">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 glass-button rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:scale-110 active:scale-95 transition-all duration-[var(--dur-fast)] shadow-lg shadow-black/10 hover:shadow-[var(--primary)]/20 border border-[var(--border-subtle)] hover:border-[var(--primary)]/30"
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
            className="p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-slide-in-up relative"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe glass border-t border-[var(--border-default)]" aria-label="Navigation mobile">
        <div className="absolute inset-0" />

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
              className="relative bg-gradient-to-r from-[var(--primary)] to-[#7c3aed] text-white p-2.5 rounded-[var(--radius-lg)] shadow-lg shadow-[var(--primary-glow)] active:scale-95 transition-transform duration-[var(--dur-fast)] ring-[3px] ring-[var(--bg-secondary)]"
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
        <div className="fixed bottom-16 md:bottom-3 right-3 z-40 glass px-2 py-1 rounded-[var(--radius-md)] flex items-center gap-1.5 text-[9px] text-[var(--text-secondary)] font-medium">
          <div className="w-3 h-3 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--primary)]" aria-hidden />
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
    type="button"
    onClick={onClick}
    className={`w-full group flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] transition-all duration-[var(--dur-fast)] relative active:scale-95 hover:scale-[1.01] ${active
      ? 'bg-[var(--primary-light)] text-[var(--primary)] before:absolute before:left-0 before:inset-y-2 before:w-0.5 before:bg-[var(--primary)] before:rounded-full'
      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]'
      }`}
  >
    <span className={`relative transition-transform duration-[var(--dur-fast)] ${active ? 'scale-105' : 'group-hover:scale-110'}`}>
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-2 -top-2 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-[var(--primary)] text-white text-[7px] font-bold animate-badge-pop shadow-sm shadow-[var(--primary-glow)]">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
    <span className={`text-[9px] font-medium tracking-wide flex-1 text-left ${active ? 'font-semibold' : ''}`}>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-[var(--radius-md)] transition-all duration-[var(--dur-fast)] active:scale-95 min-w-[52px] relative ${active
      ? 'text-[var(--primary)]'
      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
      }`}
  >
    {active && (
      <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-badge-pop" />
    )}

    <span className={`relative z-10 transition-transform duration-[var(--dur-fast)] ${active ? 'scale-110 text-[var(--primary)]' : ''}`}>
      {icon}
    </span>

    {label && (
      <span className={`relative z-10 text-[7px] font-medium tracking-wider mt-1 transition-colors duration-[var(--dur-fast)] ${active
        ? 'text-[var(--primary)] font-semibold'
        : 'text-[var(--text-tertiary)]'
        }`}>
        {label}
      </span>
    )}
  </button>
);

export default App;