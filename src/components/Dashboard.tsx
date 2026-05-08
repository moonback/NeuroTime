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
  } = useDashboardExports(missions, allCompletedMissions, selectedMonthDate);

  return (
    <div className="space-y-3 md:space-y-5 pb-16 md:pb-8 animate-fade-in">
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


      {/* KPI Stats Grid — ENHANCED FOR DESKTOP */}
      <div className="animate-slide-in-up stagger-1">
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
      </div>

      <RevenueMissionsModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        missions={[...selectedMonthCompletedMissions, ...selectedMonthPlannedMissions]}
        selectedMonthDate={selectedMonthDate}
        onEdit={onEdit}
        hidePrices={hidePrices}
      />

      {/* Détail des 3 derniers mois */}
      <div className="animate-slide-in-up stagger-2">
        <RecentHistory data={lastThreeMonths} hidePrices={hidePrices} />
      </div>

      {/* Statistiques avancées et Objectifs — ENHANCED GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6 animate-slide-in-up stagger-3">
        <div className="glass-card rounded-xl p-4 md:p-5 border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
          <DashboardStats missions={missions} selectedMonth={selectedMonthDate} />
        </div>
        <div className="glass-card rounded-xl p-4 md:p-5 border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
          <DashboardGoals missions={missions} selectedMonth={selectedMonthDate} />
        </div>
      </div>

      {/* Upcoming / Planned Missions List */}
      <div className="animate-slide-in-up stagger-4">
        <UpcomingMissionsList
          upcomingMissions={upcomingMissions}
          onEdit={onEdit}
          onValidate={onValidate}
          hidePrices={hidePrices}
        />
      </div>


      {/* Data Persistence Section */}
      <div className="animate-slide-in-up stagger-5">
        <DataPersistence
          onImport={onImport}
          onBackup={backupData}
        />
      </div>
    </div>
  );
};

export default Dashboard;
