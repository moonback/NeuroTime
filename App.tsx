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
    const loadData = async () => {
      const data = await loadMissions();
      setMissions(data);
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save data whenever it changes, BUT only if initial load is done
  useEffect(() => {
    if (isLoaded) {
      saveMissions(missions).catch(error => {
        console.error('Erreur lors de la sauvegarde:', error);
      });
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
    <div className="min-h-screen bg-dark-300 text-gray-100 font-sans selection:bg-primary-500 selection:text-dark-300 antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-50/80 backdrop-blur-xl border-r border-dark-100/60 fixed inset-y-0 z-20 shadow-lg shadow-black/20">
        <div className="p-6 border-b border-dark-100/80">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500 bg-clip-text text-transparent tracking-tight">
            NeuroTime
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-medium">Gestion personnelle</p>
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

        <div className="p-4 space-y-2 border-t border-dark-100/80">
           <button 
            onClick={() => setIsImportModalOpen(true)}
            className="w-full bg-dark-100/50 hover:bg-dark-100 text-primary-300 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 border border-primary-500/30 transition-all text-sm"
          >
            <Sparkles size={16} />
            <span>Scanner IA</span>
          </button>
           <button 
            onClick={() => openNewMissionModal()}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-dark-300 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 transition-all text-sm"
          >
            <Plus size={18} />
            <span>Nouvelle mission</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 bg-dark-300">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-50/95 backdrop-blur-xl border-t border-dark-100/80 z-30 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
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
              className="bg-gradient-to-br from-primary-500 to-primary-600 text-dark-300 p-3.5 rounded-full shadow-lg shadow-primary-500/50 transform active:scale-90 transition-all ring-4 ring-dark-50"
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
        ? 'bg-primary-500/20 text-primary-300 font-semibold shadow-sm border border-primary-500/30' 
        : 'text-gray-400 hover:bg-dark-100/50 hover:text-gray-200'
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