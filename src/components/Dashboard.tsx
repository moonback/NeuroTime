import React from 'react';
import { Mission } from '../types';
import DashboardStats from './DashboardStats';
import DashboardGoals from './DashboardGoals';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useDashboardExports } from '../hooks/useDashboardExports';
import DashboardHeader from './dashboard/DashboardHeader';
import NextMissionCard from './dashboard/NextMissionCard';
import DashboardKPIs from './dashboard/DashboardKPIs';
import UpcomingMissionsList from './dashboard/UpcomingMissionsList';
import DataPersistence from './dashboard/DataPersistence';

interface DashboardProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  onImport: (missions: Mission[]) => void;
  hidePrices?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ missions, onEdit, onValidate, onImport, hidePrices = false }) => {
  // Logic extraction via Custom Hooks
  const {
    selectedMonth,
    setSelectedMonth,
    selectedMonthDate,
    allCompletedMissions,
    selectedMonthCompletedMissions,
    totalHours,
    totalEarnings,
    totalEarningsCompleted,
    totalEarningsPlanned,
    upcomingMissions,
    nextMission,
    averageHourlyRate,
    monthlyComparison,
    mostProfitableMission
  } = useDashboardStats(missions);

  const {
    downloadCSV,
    downloadCompletedReportMD,
    downloadCompletedReportPDF,
    backupData
  } = useDashboardExports(missions, allCompletedMissions);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fade-in">
      {/* Header amélioré */}
      <DashboardHeader
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedMonthDate={selectedMonthDate}
        onDownloadCSV={downloadCSV}
        onDownloadMD={downloadCompletedReportMD}
        onDownloadPDF={downloadCompletedReportPDF}
      />

      {/* Vue d'ensemble rapide - Prochaine mission améliorée */}
      <div className="animate-slide-in-up">
        <NextMissionCard
          nextMission={nextMission}
          onEdit={onEdit}
          onValidate={onValidate}
          hidePrices={hidePrices}
        />
      </div>


      {/* KPI Stats Grid */}
      <DashboardKPIs
        selectedMonthDate={selectedMonthDate}
        totalEarnings={totalEarnings}
        totalEarningsCompleted={totalEarningsCompleted}
        totalEarningsPlanned={totalEarningsPlanned}
        totalHours={totalHours}
        completedMissionsCount={selectedMonthCompletedMissions.length}
        upcomingMissionsCount={upcomingMissions.length}
        averageHourlyRate={averageHourlyRate}
        monthlyComparison={monthlyComparison}
        mostProfitableMission={mostProfitableMission}
        hidePrices={hidePrices}
      />

      {/* Statistiques avancées et Objectifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardStats missions={missions} selectedMonth={selectedMonthDate} />
        <DashboardGoals missions={missions} selectedMonth={selectedMonthDate} />
      </div>

      {/* Upcoming / Planned Missions List */}
      <UpcomingMissionsList
        upcomingMissions={upcomingMissions}
        onEdit={onEdit}
        onValidate={onValidate}
        hidePrices={hidePrices}
      />


      {/* Data Persistence Section */}
      <DataPersistence
        onImport={onImport}
        onBackup={backupData}
      />
    </div>
  );
};

export default Dashboard;
