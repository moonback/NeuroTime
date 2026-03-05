import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Mission } from '../types';

export const useDashboardStats = (missions: Mission[]) => {
  const now = new Date();

  // Sélecteur de mois - format YYYY-MM (défaut: mois en cours)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return format(now, 'yyyy-MM');
  });

  // Date du mois sélectionné
  const selectedMonthDate = useMemo(() => {
    return parseISO(`${selectedMonth}-01`);
  }, [selectedMonth]);

  const selectedMonthStart = useMemo(() => startOfMonth(selectedMonthDate), [selectedMonthDate]);
  const selectedMonthEnd = useMemo(() => endOfMonth(selectedMonthDate), [selectedMonthDate]);

  // Calculate Stats - Toutes les missions terminées (completed) sont comptabilisées
  const allCompletedMissions = useMemo(() =>
    missions.filter(m => m.status === 'completed'),
    [missions]
  );

  // Missions du mois sélectionné
  const selectedMonthStartTime = useMemo(() => selectedMonthStart.getTime(), [selectedMonthStart]);
  const selectedMonthEndTime = useMemo(() => selectedMonthEnd.getTime(), [selectedMonthEnd]);

  const selectedMonthCompletedMissions = useMemo(() => {
    return allCompletedMissions.filter(m => {
      const missionEndTime = new Date(m.endTime).getTime();
      return missionEndTime >= selectedMonthStartTime && missionEndTime <= selectedMonthEndTime;
    });
  }, [allCompletedMissions, selectedMonthStartTime, selectedMonthEndTime]);

  const selectedMonthPlannedMissions = useMemo(() => {
    return missions.filter(m => {
      if (m.status !== 'planned') return false;
      const missionStartTime = new Date(m.startTime).getTime();
      return missionStartTime >= selectedMonthStartTime && missionStartTime <= selectedMonthEndTime;
    });
  }, [missions, selectedMonthStartTime, selectedMonthEndTime]);

  // Heures et gains des missions terminées du mois sélectionné
  const totalHours = useMemo(() => {
    let hours = 0;
    for (const m of selectedMonthCompletedMissions) {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      hours += (end - start) / (1000 * 60 * 60);
    }
    return Math.round(hours * 10) / 10;
  }, [selectedMonthCompletedMissions]);

  // CA réalisé : toutes les missions terminées (utilisé pour les KPIs de rendement)
  const totalEarningsCompleted = useMemo(() => {
    let earnings = 0;
    for (const m of selectedMonthCompletedMissions) {
      earnings += m.totalEarnings || 0;
    }
    return Math.round(earnings * 100) / 100;
  }, [selectedMonthCompletedMissions]);

  // CA Encaissé (missions terminées ET payées)
  const totalEarningsCollected = useMemo(() => {
    let earnings = 0;
    for (const m of selectedMonthCompletedMissions) {
      if (m.isPaid) {
        earnings += m.totalEarnings || 0;
      }
    }
    return Math.round(earnings * 100) / 100;
  }, [selectedMonthCompletedMissions]);

  // CA Prévisionnel (planifiées + terminées non payées)
  const totalEarningsExpected = useMemo(() => {
    let earnings = 0;
    for (const m of selectedMonthCompletedMissions) {
      if (!m.isPaid) {
        earnings += m.totalEarnings || 0;
      }
    }
    for (const m of selectedMonthPlannedMissions) {
      earnings += m.totalEarnings || 0;
    }
    return Math.round(earnings * 100) / 100;
  }, [selectedMonthCompletedMissions, selectedMonthPlannedMissions]);

  // Gains prévisionnels des missions planifiées du mois sélectionné
  const totalEarningsPlanned = useMemo(() => {
    let earnings = 0;
    for (const m of selectedMonthPlannedMissions) {
      earnings += m.totalEarnings || 0;
    }
    return Math.round(earnings * 100) / 100;
  }, [selectedMonthPlannedMissions]);

  // Total = Réalisé + Prévisionnel
  const totalEarnings = useMemo(() =>
    totalEarningsCompleted + totalEarningsPlanned,
    [totalEarningsCompleted, totalEarningsPlanned]
  );

  // Upcoming missions
  const upcomingMissions = useMemo(() => {
    const nowTime = new Date().getTime();
    return missions
      .filter(m => {
        // Une mission est "à venir" si elle est planifiée ET qu'elle n'est pas encore terminée
        // (Cela inclut les missions en cours)
        if (m.status !== 'planned') return false;
        const endTime = new Date(m.endTime).getTime();
        return endTime > nowTime;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4);
  }, [missions]);

  // Recent completed missions
  const recentCompletedMissions = useMemo(() =>
    allCompletedMissions
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 5),
    [allCompletedMissions]
  );

  const nextMission = useMemo(() => upcomingMissions[0] ?? null, [upcomingMissions]);

  // KPIs avancés (sans inclure les missions à tarif personnalisé)
  const averageHourlyRate = useMemo(() => {
    let hourlyEarnings = 0;
    let hourlyHours = 0;

    for (const m of selectedMonthCompletedMissions) {
      if (m.rateType !== 'custom') {
        hourlyEarnings += m.totalEarnings || 0;
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        hourlyHours += (end - start) / (1000 * 60 * 60);
      }
    }

    if (hourlyHours === 0 || hourlyEarnings === 0) return 0;
    const rate = hourlyEarnings / hourlyHours;
    return Math.round(rate * 100) / 100;
  }, [selectedMonthCompletedMissions]);

  // Comparaison mensuelle
  const monthlyComparison = useMemo(() => {
    const lastMonthStart = startOfMonth(subMonths(selectedMonthDate, 1));
    const lastMonthEnd = endOfMonth(subMonths(selectedMonthDate, 1));
    const lastMonthStartTime = lastMonthStart.getTime();
    const lastMonthEndTime = lastMonthEnd.getTime();

    const thisMonthRevenue = totalEarningsCompleted;

    let lastMonthRevenue = 0;
    for (const m of allCompletedMissions) {
      const missionEndTime = new Date(m.endTime).getTime();
      if (missionEndTime >= lastMonthStartTime && missionEndTime <= lastMonthEndTime) {
        lastMonthRevenue += m.totalEarnings || 0;
      }
    }
    lastMonthRevenue = Math.round(lastMonthRevenue * 100) / 100;

    const difference = thisMonthRevenue - lastMonthRevenue;
    const percentage = lastMonthRevenue > 0
      ? Math.round((difference / lastMonthRevenue) * 100 * 10) / 10
      : 0;

    return {
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      difference: Math.round(difference * 100) / 100,
      percentage,
      isPositive: difference >= 0,
    };
  }, [totalEarningsCompleted, allCompletedMissions, selectedMonthDate]);

  // Mission la plus rentable
  const mostProfitableMission = useMemo(() => {
    if (selectedMonthCompletedMissions.length === 0) return null;
    return selectedMonthCompletedMissions.reduce((max, m) =>
      (m.totalEarnings || 0) > (max.totalEarnings || 0) ? m : max
    );
  }, [selectedMonthCompletedMissions]);

  // Statistiques des 3 derniers mois
  const lastThreeMonths = useMemo(() => {
    return Array.from({ length: 3 }).map((_, i) => {
      const monthDate = subMonths(selectedMonthDate, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const startTime = start.getTime();
      const endTime = end.getTime();

      const monthMissions = allCompletedMissions.filter(m => {
        const missionEndTime = new Date(m.endTime).getTime();
        return missionEndTime >= startTime && missionEndTime <= endTime;
      });

      const earnings = monthMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
      let hours = 0;
      for (const m of monthMissions) {
        const s = new Date(m.startTime).getTime();
        const e = new Date(m.endTime).getTime();
        hours += (e - s) / (1000 * 60 * 60);
      }

      return {
        label: format(monthDate, 'MMMM', { locale: fr }),
        year: format(monthDate, 'yyyy'),
        earnings: Math.round(earnings * 100) / 100,
        hours: Math.round(hours * 10) / 10,
        count: monthMissions.length
      };
    }).reverse();
  }, [allCompletedMissions, selectedMonthDate]);

  return {
    selectedMonth,
    setSelectedMonth,
    selectedMonthDate,
    allCompletedMissions,
    selectedMonthCompletedMissions,
    totalHours,
    totalEarnings,
    totalEarningsCompleted,
    totalEarningsPlanned,
    totalEarningsCollected,
    totalEarningsExpected,
    upcomingMissions,
    recentCompletedMissions,
    nextMission,
    averageHourlyRate,
    monthlyComparison,
    mostProfitableMission,
    lastThreeMonths
  };
};

