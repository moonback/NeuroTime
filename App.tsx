import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Plus, Menu, ListChecks, Sparkles } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import MissionsList from './components/MissionsList';
import MissionForm from './components/MissionForm';
import ImageImportModal from './components/ImageImportModal';
import { Mission, ViewState } from './types';
import { loadMissions, saveMissions } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | undefined>(undefined);
  
  // État pour éviter d'écraser le localStorage au démarrage avant le chargement
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    const data = loadMissions();
    setMissions(data);
    setIsLoaded(true);
  }, []);

  // Save data whenever it changes, BUT only if initial load is done
  useEffect(() => {
    if (isLoaded) {
      saveMissions(missions);
    }
  }, [missions, isLoaded]);

  const handleSaveMission = (mission: Mission) => {
    if (editingMission) {
      setMissions(prev => prev.map(m => m.id === mission.id ? mission : m));
    } else {
      setMissions(prev => [...prev, mission]);
    }
    setEditingMission(null);
  };

  const handleBulkAddMissions = (newMissions: Mission[]) => {
    setMissions(prev => [...prev, ...newMissions]);
  };

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

  const handleDeleteMission = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette mission ?")) {
      setMissions(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleImportData = (importedMissions: Mission[]) => {
    if (window.confirm(`Attention, l'importation va remplacer vos ${missions.length} missions actuelles par ${importedMissions.length} missions importées. Continuer ?`)) {
      setMissions(importedMissions);
      alert("Données restaurées avec succès !");
    }
  };

  const openNewMissionModal = (dateStr?: string) => {
    setEditingMission(null);
    setSelectedDateForNew(dateStr);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-primary-100 antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 fixed inset-y-0 z-20 shadow-sm">
        <div className="p-6 border-b border-gray-100/80">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-blue-600 bg-clip-text text-transparent tracking-tight">
            NeuroTime
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Gestion personnelle</p>
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
        </nav>

        <div className="p-4 space-y-2 border-t border-gray-100/80">
           <button 
            onClick={() => setIsImportModalOpen(true)}
            className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 border border-purple-100/60 transition-all text-sm"
          >
            <Sparkles size={16} />
            <span>Scanner IA</span>
          </button>
           <button 
            onClick={() => openNewMissionModal()}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-primary-500/25 transition-all text-sm"
          >
            <Plus size={18} />
            <span>Nouvelle mission</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 z-30 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
              className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-3.5 rounded-full shadow-lg shadow-primary-500/40 transform active:scale-90 transition-all ring-4 ring-white"
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
        </div>
      </nav>

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
    </div>
  );
};

// Sub-components for Nav
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
      active 
        ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm' 
        : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
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
        ? 'text-primary-600 bg-primary-50/50' 
        : 'text-gray-500 active:text-primary-600'
    }`}
  >
    {icon}
    {label && <span className="text-[10px] mt-1 font-semibold leading-tight">{label}</span>}
  </button>
);

export default App;