import React, { useEffect, useState, useRef } from 'react';
import { Mission } from '../types';
import { generateSummary } from '../services/geminiService';
import { Clock, CheckCircle, TrendingUp, Calendar, MapPin, Briefcase, Euro, Download, Moon, Sun, Upload, Database, Save } from 'lucide-react';
import { format, isThisMonth } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface DashboardProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  onImport: (missions: Mission[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ missions, onEdit, onValidate, onImport }) => {
  const [summary, setSummary] = useState<string>('Analyse de vos activités en cours...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate Stats
  const thisMonthMissions = missions.filter(m => isThisMonth(new Date(m.startTime)));
  
  const totalHours = thisMonthMissions.reduce((acc, m) => {
    const start = new Date(m.startTime).getTime();
    const end = new Date(m.endTime).getTime();
    return acc + (end - start) / (1000 * 60 * 60);
  }, 0);

  const totalEarnings = thisMonthMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
  
  // Upcoming includes planned missions in the future OR today
  const upcomingMissions = missions
    .filter(m => m.status === 'planned')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 4);

  useEffect(() => {
    if (missions.length > 0) {
      generateSummary(missions).then(setSummary);
    } else {
      setSummary("Aucune mission enregistrée. Commencez par noter vos heures !");
    }
  }, [missions.length]);

  const downloadCSV = () => {
    const headers = ['Titre', 'Client', 'Date', 'Début', 'Fin', 'Lieu', 'Tarif Type', 'Taux/h', 'Total (€)', 'Statut'];
    const rows = missions.map(m => [
      `"${m.title}"`,
      `"${m.client}"`,
      format(new Date(m.startTime), 'dd/MM/yyyy'),
      format(new Date(m.startTime), 'HH:mm'),
      format(new Date(m.endTime), 'HH:mm'),
      `"${m.location}"`,
      m.rateType === 'night' ? 'Nuit' : 'Jour',
      m.hourlyRate,
      m.totalEarnings?.toFixed(2) || 0,
      m.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eventflow_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const backupData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(missions, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `eventflow_backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImport(json);
        } else {
          alert("Le fichier ne semble pas valide.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier de sauvegarde.");
      }
    };
    reader.readAsText(file);
    // Reset value so we can load same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Tableau de bord</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={downloadCSV}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm"
              title="Exporter pour Excel"
            >
              <Download size={16} />
              <span className="hidden md:inline">Exporter CSV</span>
              <span className="md:hidden">CSV</span>
            </button>
        </div>
      </header>

      {/* AI Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-5 md:p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
               <SparklesIcon className="w-4 h-4 text-yellow-300" />
            </span>
            <h3 className="font-semibold text-base md:text-lg tracking-wide opacity-95">Assistant Intelligent</h3>
          </div>
          <p className="text-indigo-50/95 leading-relaxed text-sm md:text-base font-normal max-w-2xl">{summary}</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl group-hover:opacity-10 transition-opacity duration-700"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-blue-500 opacity-20 blur-2xl"></div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
          icon={<Euro className="w-6 h-6 text-emerald-600" />}
          label="CA ce mois"
          value={`${totalEarnings.toFixed(0)} €`}
          subtext="Prévisionnel + Réalisé"
          color="bg-emerald-50 border-emerald-100"
          textColor="text-emerald-700"
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          label="Heures totales"
          value={`${totalHours.toFixed(1)} h`}
          subtext="Cumul mensuel"
          color="bg-blue-50 border-blue-100"
          textColor="text-blue-700"
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-purple-600" />}
          label="Missions finies"
          value={missions.filter(m => m.status === 'completed').length.toString()}
          subtext="Total missions"
          color="bg-purple-50 border-purple-100"
          textColor="text-purple-700"
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          label="À venir"
          value={upcomingMissions.length.toString()}
          subtext="À planifier / valider"
          color="bg-orange-50 border-orange-100"
          textColor="text-orange-700"
        />
      </div>

      {/* Upcoming / Planned Missions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2.5">
            <span className="bg-gray-100 p-2 rounded-lg">
               <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </span>
            <span>À venir</span>
          </h3>
          <span className="text-xs md:text-sm text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
            {upcomingMissions.length} en attente
          </span>
        </div>

        {upcomingMissions.length === 0 ? (
          <div className="text-center py-10 md:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
              <CheckCircle className="text-green-400" size={20} />
            </div>
            <p className="text-gray-500 font-medium text-sm md:text-base">Tout est à jour !</p>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Aucune mission en attente</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {upcomingMissions.map((mission) => (
              <div key={mission.id} className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all duration-200">
                
                {/* Date Badge */}
                <div 
                  onClick={() => onEdit(mission)}
                  className="flex cursor-pointer md:flex-col items-center gap-2 md:gap-0 bg-white p-2.5 md:p-3 rounded-lg min-w-[70px] md:min-w-[80px] text-center border border-gray-200 group-hover:bg-primary-50 group-hover:border-primary-200 transition-colors shadow-sm"
                >
                  <div className="text-[10px] md:text-xs text-gray-500 group-hover:text-primary-600 uppercase font-bold tracking-wider">
                    {format(new Date(mission.startTime), 'MMM', { locale: fr })}
                  </div>
                  <div className="text-xl md:text-2xl font-black text-gray-800 group-hover:text-primary-700 leading-none md:mt-1">
                    {format(new Date(mission.startTime), 'dd')}
                  </div>
                  <div className="md:hidden h-6 w-[1px] bg-gray-300 mx-2"></div>
                  <div className="md:hidden text-base font-bold text-gray-700">
                     {format(new Date(mission.startTime), 'HH:mm')}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(mission)}>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-900 text-base md:text-lg truncate group-hover:text-primary-700 transition-colors">{mission.title}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 flex-shrink-0">
                       {mission.totalEarnings?.toFixed(0)}€
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-y-1.5 gap-x-3 mt-2 text-xs md:text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-gray-100">
                      <Clock size={12} className="text-gray-400" />
                      {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="truncate max-w-[150px]">{mission.location}</span>
                    </span>
                     <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium">
                       {mission.rateType === 'night' ? <Moon size={10} className="text-blue-400" /> : <Sun size={10} className="text-orange-400" />}
                       {mission.rateType === 'night' ? 'Nuit' : 'Jour'}
                     </span>
                  </div>
                </div>

                {/* Action: Validate */}
                <div className="flex items-center justify-end md:justify-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onValidate(mission);
                    }}
                    className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-semibold text-xs md:text-sm transition-all shadow-sm"
                    title="Valider les heures"
                  >
                    <CheckCircle size={14} />
                    <span className="hidden lg:inline">Valider</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

       {/* Data Persistence Section */}
       <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 md:p-5">
          <div className="flex items-center gap-2.5 mb-3">
             <div className="bg-gray-200 p-1.5 rounded-lg text-gray-600">
               <Database size={18} />
             </div>
             <h3 className="text-base md:text-lg font-bold text-gray-800">Sauvegarde</h3>
          </div>
          <p className="text-xs md:text-sm text-gray-600 mb-4">
            Sauvegardez régulièrement vos données pour éviter toute perte.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button 
              onClick={backupData}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all flex-1 text-sm"
            >
              <Save size={16} />
              Sauvegarder
            </button>
            
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all text-sm"
              >
                <Upload size={16} />
                Restaurer
              </button>
            </div>
          </div>
       </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext, color, textColor }: any) => (
  <div className={`p-4 md:p-5 rounded-xl border transition-all hover:shadow-md ${color} bg-opacity-50`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl bg-white shadow-sm ${textColor}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className={`text-xs md:text-sm font-semibold mt-1 ${textColor} opacity-90`}>{label}</p>
      <p className="text-[10px] md:text-xs text-gray-500 mt-1.5">{subtext}</p>
    </div>
  </div>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
  </svg>
);

export default Dashboard;