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
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans selection:bg-primary-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 z-20">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            EventFlow
          </h1>
          <p className="text-xs text-gray-400 mt-1">Freelance Manager</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
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
            label="Mes Missions" 
          />
          <NavButton 
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
            icon={<CalendarIcon size={20} />} 
            label="Agenda" 
          />
        </nav>

        <div className="p-4 space-y-3">
           <button 
            onClick={() => setIsImportModalOpen(true)}
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-purple-100 transition-all"
          >
            <Sparkles size={18} />
            <span>Scanner Planning</span>
          </button>
           <button 
            onClick={() => openNewMissionModal()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all"
          >
            <Plus size={20} />
            <span>Noter Heures</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe">
        <div className="flex justify-around items-center p-2">
          <MobileNavButton 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<LayoutDashboard size={24} />} 
            label="Accueil"
          />
          
          <MobileNavButton 
            active={view === 'missions'} 
            onClick={() => setView('missions')} 
            icon={<ListChecks size={24} />} 
            label="Missions"
          />

          <div className="relative -top-6">
            <button 
              onClick={() => openNewMissionModal()}
              className="bg-primary-600 text-white p-4 rounded-full shadow-xl shadow-primary-500/40 transform active:scale-95 transition-transform"
            >
              <Plus size={28} />
            </button>
          </div>

           <MobileNavButton 
            active={false}
            onClick={() => setIsImportModalOpen(true)}
            icon={<Sparkles size={24} />} 
            label="Scan IA"
          />

          <MobileNavButton 
            active={view === 'calendar'} 
            onClick={() => setView('calendar')} 
            icon={<CalendarIcon size={24} />} 
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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-primary-50 text-primary-700 font-medium' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
      active ? 'text-primary-600' : 'text-gray-400'
    }`}
  >
    {icon}
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

export default App;