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

      {/* Sidebar — COMPACT */}
      <aside
        className={`hidden md:flex flex-col w-56 border-r border-white/[0.04] fixed inset-y-0 z-20 transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[#080b14]/95 backdrop-blur-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        onMouseLeave={() => { if (!sidebarPinned) setIsSidebarOpen(false) }}
      >
        <div className="p-4 pb-3 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <img src="/logo.png" alt="Logo NeuroTime" className="h-7 w-auto object-contain object-left mb-1" />
              <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em] leading-none opacity-70">
                Freelance Platform
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSidebarPinned}
              className={`p-1.5 rounded-lg transition-all ${sidebarPinned ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-600 hover:text-white'}`}
            >
              {sidebarPinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto custom-scrollbar" aria-label="Navigation principale">
          <div className="px-2 mb-1.5">
            <span className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.12em]">Navigation</span>
          </div>
          <NavButton
            active={location.pathname === '/'}
            onClick={() => { navigate('/'); setIsSidebarOpen(false) }}
            icon={<LayoutDashboard size={15} />}
            label="Tableau de bord"
          />
          <NavButton
            active={location.pathname === '/missions'}
            onClick={() => { navigate('/missions'); setIsSidebarOpen(false) }}
            icon={<ListChecks size={15} />}
            label="Missions"
          />
          <NavButton
            active={location.pathname === '/payments'}
            onClick={() => { navigate('/payments'); setIsSidebarOpen(false) }}
            icon={<Euro size={15} />}
            label="Paiements"
          />
          <NavButton
            active={location.pathname === '/stats'}
            onClick={() => { navigate('/stats'); setIsSidebarOpen(false) }}
            icon={<BarChart3 size={15} />}
            label="Analyses"
          />
          <NavButton
            active={location.pathname === '/urssaf'}
            onClick={() => { navigate('/urssaf'); setIsSidebarOpen(false) }}
            icon={<Calculator size={15} />}
            label="URSSAF"
          />
          <NavButton
            active={location.pathname === '/profile'}
            onClick={() => { navigate('/profile'); setIsSidebarOpen(false) }}
            icon={<User size={15} />}
            label="Mon Profil"
          />
        </nav>

        <div className="p-2.5 space-y-2.5">
          <button
            onClick={() => { openNewMissionModal(); setIsSidebarOpen(false) }}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-[0_2px_12px_rgba(99,102,241,0.25)]"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="text-[10px] uppercase tracking-wider font-bold">Nouvelle mission</span>
          </button>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#080b14] rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-white truncate leading-none mb-0.5">{user.email?.split('@')[0]}</span>
                <button
                  onClick={() => navigate('/profile')}
                  className="text-[7px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider text-left"
                >
                  Voir Profil
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={toggleHidePrices}
                className={`flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg border transition-all text-[7px] font-bold uppercase ${hidePrices ? 'bg-orange-500/10 border-orange-500/15 text-orange-400' : 'bg-white/[0.03] border-white/[0.04] text-gray-500 hover:text-white'}`}
              >
                {hidePrices ? <EyeOff size={11} /> : <Eye size={11} />}
                <span>Tarifs</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-gray-500 hover:text-red-400 transition-all text-[7px] font-bold uppercase"
              >
                <LogOut size={11} />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header — COMPACT */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 pb-safe">
        <div className="bg-[#080b14]/90 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo NeuroTime" className="h-6 object-contain" />
              <span className="text-[10px] text-gray-500 font-medium">
                {format(new Date(), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <button
              onClick={toggleHidePrices}
              className={`flex items-center justify-center p-2 rounded-lg transition-all ${hidePrices ? 'text-orange-400 bg-orange-500/15' : 'text-gray-400 bg-white/[0.04]'}`}
              aria-pressed={hidePrices}
            >
              {hidePrices ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`min-h-screen min-h-[100dvh] pb-16 md:pb-0 bg-transparent overflow-y-auto relative pt-[52px] md:pt-0 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarOpen ? 'md:ml-56' : 'md:ml-0'}`}>
        {/* Sidebar Toggle Button (Desktop) */}
        <div className="hidden md:block fixed top-3 left-3 z-10 opacity-40 hover:opacity-100 transition-opacity">
          {!sidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 glass-button rounded-lg text-gray-400 hover:text-white"
              aria-label="Ouvrir la navigation"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <Suspense fallback={<LoadingSpinner fullScreen text="Chargement..." />}>
          {/*
            key={location.key} forces React to unmount/remount this div
            on every navigation, re-triggering the entrance animation.
          */}
          <div
            key={location.key}
            className="p-3 md:p-5 lg:p-6 max-w-12xl mx-auto animate-slide-in-up relative"
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

      {/* Mobile Bottom Navigation — COMPACT & PRO */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe" aria-label="Navigation mobile">
        {/* Background */}
        <div className="absolute inset-0 bg-[#080b14]/95 backdrop-blur-2xl border-t border-white/[0.05]" />

        {/* Subtle top glow line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="relative flex justify-around items-center px-1 py-1.5">
          <MobileNavButton
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
            icon={<LayoutDashboard size={19} />}
            label="Accueil"
          />
          <MobileNavButton
            active={location.pathname === '/missions'}
            onClick={() => navigate('/missions')}
            icon={<ListChecks size={19} />}
            label="Missions"
          />

          {/* Central FAB — Refined */}
          <div className="relative -top-3 flex items-center justify-center">
            <button
              onClick={() => openNewMissionModal()}
              className="relative bg-indigo-500 active:bg-indigo-600 text-white p-3 rounded-2xl shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] active:scale-95 transition-all duration-200 ring-[3px] ring-[#080b14]"
              aria-label="Ajouter une mission"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          <MobileNavButton
            active={location.pathname === '/payments'}
            onClick={() => navigate('/payments')}
            icon={<Euro size={19} />}
            label="Paiements"
          />
          <MobileNavButton
            active={location.pathname === '/urssaf'}
            onClick={() => navigate('/urssaf')}
            icon={<Calculator size={19} />}
            label="URSSAF"
          />
          <MobileNavButton
            active={location.pathname === '/profile'}
            onClick={() => navigate('/profile')}
            icon={<User size={19} />}
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
        <div className="fixed bottom-20 md:bottom-4 right-3 z-40 glass-card px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
          <div className="w-2.5 h-2.5 border-[1.5px] border-indigo-400 border-t-transparent rounded-full animate-spin" aria-hidden />
          <span>Sauvegarde…</span>
        </div>
      )}
    </div>
  );
};

/* ============================================
   NAV BUTTONS - Compact & Modern
   ============================================ */

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full group flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl transition-all duration-150 relative ${active
      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
      : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03] border border-transparent'
      }`}
  >
    <span className={`transition-transform duration-150 ${active ? 'scale-105' : ''}`}>
      {icon}
    </span>
    <span className={`text-[10px] font-semibold tracking-wide transition-all ${active ? 'opacity-100 font-bold' : 'opacity-70'}`}>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 min-w-[52px] relative ${active
      ? 'text-indigo-400'
      : 'text-gray-500 active:text-indigo-400'
      }`}
  >
    {/* Active indicator dot */}
    {active && (
      <div className="absolute -top-0.5 w-1 h-1 rounded-full bg-indigo-400" />
    )}

    {/* Icon */}
    <span className={`relative z-10 transition-all duration-150 ${active ? '' : ''}`}>
      {icon}
    </span>

    {/* Label - always visible for clarity */}
    {label && (
      <span className={`relative z-10 text-[8px] font-semibold tracking-wider mt-0.5 ${active
        ? 'text-indigo-400'
        : 'text-gray-600'
        }`}>
        {label}
      </span>
    )}
  </button>
);

export default App;