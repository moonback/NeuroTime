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

import RecentHistory from './dashboard/RecentHistory';
import RevenueMissionsModal from './dashboard/RevenueMissionsModal';
import { useState } from 'react';

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
    selectedMonthPlannedMissions,
    totalHours,
    totalEarnings,
    totalEarningsCompleted,
    totalEarningsPlanned,
    totalEarningsCollected,
    totalEarningsExpected,
    totalDayHours,
    totalNightHours,
    upcomingMissions,
    nextMission,
    averageHourlyRate,
    averageDayHourlyRate,
    averageNightHourlyRate,
    monthlyComparison,
    mostProfitableMission,
    lastThreeMonths
  } = useDashboardStats(missions);

  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  const {
    downloadCSV,
    downloadCompletedReportMD,
    downloadCompletedReportPDF,
    backupData
  } = useDashboardExports(missions, allCompletedMissions);

  return (
    <div className="space-y-4 md:space-y-5 pb-20 md:pb-6 animate-fade-in">
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
        totalEarningsCollected={totalEarningsCollected}
        totalEarningsExpected={totalEarningsExpected}
        totalHours={totalHours}
        totalDayHours={totalDayHours}
        totalNightHours={totalNightHours}
        completedMissionsCount={selectedMonthCompletedMissions.length}
        upcomingMissionsCount={upcomingMissions.length}
        averageHourlyRate={averageHourlyRate}
        averageDayHourlyRate={averageDayHourlyRate}
        averageNightHourlyRate={averageNightHourlyRate}
        monthlyComparison={monthlyComparison}
        mostProfitableMission={mostProfitableMission}
        hidePrices={hidePrices}
        onRevenueClick={() => setIsRevenueModalOpen(true)}
      />

      <RevenueMissionsModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        missions={[...selectedMonthCompletedMissions, ...selectedMonthPlannedMissions]}
        selectedMonthDate={selectedMonthDate}
        onEdit={onEdit}
        hidePrices={hidePrices}
      />

      {/* Détail des 3 derniers mois */}
      <RecentHistory data={lastThreeMonths} hidePrices={hidePrices} />

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
