import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react';
import { Mission } from '../types';
import { generateSummary } from '../services/geminiService';
import { Clock, CheckCircle, TrendingUp, Calendar, MapPin, Briefcase, Euro, Download, Moon, Sun, Upload, Database, Save, TrendingDown, Award, DollarSign, ChevronDown, ChevronUp, RefreshCcw, FileText, File } from 'lucide-react';
import { format, isThisMonth, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { formatTimeSlots } from '../utils/timeSlots';
import DashboardCharts from './DashboardCharts';
import DashboardStats from './DashboardStats';
import DashboardGoals from './DashboardGoals';
import DashboardActivity from './DashboardActivity';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  missions: Mission[];
  onEdit: (mission: Mission) => void;
  onValidate: (mission: Mission) => void;
  onImport: (missions: Mission[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ missions, onEdit, onValidate, onImport }) => {
  const [summary, setSummary] = useState<string>('Analyse de vos activités en cours...');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const now = new Date();
  
  // Calculate Stats - Toutes les missions terminées (completed) sont comptabilisées
  // Missions terminées : toutes celles avec status 'completed'
  const allCompletedMissions = useMemo(() => 
    missions.filter(m => m.status === 'completed'),
    [missions]
  );
  
  // Missions du mois en cours (pour les statistiques mensuelles)
  // Pour les missions terminées : on vérifie si elles se sont terminées ce mois-ci
  // Pour les missions planifiées : on vérifie si elles commencent ce mois-ci
  const thisMonthCompletedMissions = useMemo(() => 
    allCompletedMissions.filter(m => 
      isThisMonth(new Date(m.endTime))
    ),
    [allCompletedMissions]
  );
  
  const thisMonthPlannedMissions = useMemo(() => 
    missions.filter(m => 
      m.status === 'planned' && isThisMonth(new Date(m.startTime))
    ),
    [missions]
  );
  
  // Heures et gains de TOUTES les missions terminées (réalisé total)
  const totalHours = useMemo(() => 
    allCompletedMissions.reduce((acc, m) => {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0),
    [allCompletedMissions]
  );

  // CA réalisé : TOUTES les missions terminées (pas seulement celles du mois)
  const totalEarningsCompleted = useMemo(() => 
    allCompletedMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [allCompletedMissions]
  );
  
  // Gains prévisionnels des missions planifiées du mois en cours
  const totalEarningsPlanned = useMemo(() => 
    thisMonthPlannedMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [thisMonthPlannedMissions]
  );
  
  // Total = Réalisé (toutes missions terminées) + Prévisionnel (missions planifiées du mois)
  const totalEarnings = useMemo(() => 
    totalEarningsCompleted + totalEarningsPlanned,
    [totalEarningsCompleted, totalEarningsPlanned]
  );

  // Upcoming includes planned missions in the future OR today
  const upcomingMissions = useMemo(() => 
    missions
      .filter(m => m.status === 'planned')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4),
    [missions]
  );

  // Missions terminées récentes (les 5 plus récentes)
  const recentCompletedMissions = useMemo(() => 
    allCompletedMissions
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 5),
    [allCompletedMissions]
  );

  // Vue d'ensemble
  const todayMissions = useMemo(
    () => missions.filter(m => isToday(new Date(m.startTime))),
    [missions]
  );

  const todayHours = useMemo(
    () =>
      todayMissions.reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0),
    [todayMissions]
  );

  const thisWeekMissions = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return missions.filter(m => {
      const start = new Date(m.startTime);
      return start >= weekStart && start <= weekEnd;
    });
  }, [missions, now]);

  const thisWeekHours = useMemo(
    () =>
      thisWeekMissions.reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0),
    [thisWeekMissions]
  );

  const nextMission = useMemo(() => upcomingMissions[0] ?? null, [upcomingMissions]);

  // KPIs avancés
  // Taux horaire moyen
  const averageHourlyRate = useMemo(() => {
    if (totalHours === 0) return 0;
    return totalEarningsCompleted / totalHours;
  }, [totalHours, totalEarningsCompleted]);

  // Comparaison mensuelle (ce mois vs mois précédent)
  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthRevenue = allCompletedMissions
      .filter(m => {
        const missionDate = new Date(m.endTime);
        return missionDate >= thisMonthStart && missionDate <= thisMonthEnd;
      })
      .reduce((sum, m) => sum + (m.totalEarnings || 0), 0);

    const lastMonthRevenue = allCompletedMissions
      .filter(m => {
        const missionDate = new Date(m.endTime);
        return missionDate >= lastMonthStart && missionDate <= lastMonthEnd;
      })
      .reduce((sum, m) => sum + (m.totalEarnings || 0), 0);

    const difference = thisMonthRevenue - lastMonthRevenue;
    const percentage = lastMonthRevenue > 0 ? (difference / lastMonthRevenue) * 100 : 0;

    return {
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      difference,
      percentage: Math.round(percentage * 10) / 10,
      isPositive: difference >= 0,
    };
  }, [allCompletedMissions]);

  // Mission la plus rentable
  const mostProfitableMission = useMemo(() => {
    if (allCompletedMissions.length === 0) return null;
    return allCompletedMissions.reduce((max, m) => 
      (m.totalEarnings || 0) > (max.totalEarnings || 0) ? m : max
    );
  }, [allCompletedMissions]);

  const refreshSummary = useCallback(async () => {
    if (missions.length === 0) {
      setSummary("Aucune mission enregistrée. Commencez par noter vos heures !");
      return;
    }

    setIsSummaryLoading(true);
    setSummary('Analyse de vos activités en cours...');
    try {
      const generatedSummary = await generateSummary(missions);
      setSummary(generatedSummary);
    } catch (error) {
      console.warn('Erreur lors du rafraîchissement du résumé IA', error);
      setSummary("Impossible de rafraîchir le résumé pour le moment.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [missions]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const escapeCsv = (value: string | number | null | undefined) => {
    if (value === undefined || value === null) return '""';
    if (typeof value === 'number') return value.toString();
    return `"${value.replace(/"/g, '""')}"`;
  };

  const rateTypeLabel = (rateType: Mission['rateType']) => {
    switch (rateType) {
      case 'day':
        return 'Jour';
      case 'night':
        return 'Nuit';
      case 'mixed':
        return 'Mixte';
      case 'custom':
      default:
        return 'Personnalisé';
    }
  };

  const downloadCSV = () => {
    const headers = ['Titre', 'Client', 'Date', 'Début', 'Fin', 'Lieu', 'Tarif Type', 'Taux/h', 'Total (€)', 'Statut'];
    const rows = missions.map(m => [
      escapeCsv(m.title),
      escapeCsv(m.client),
      format(new Date(m.startTime), 'dd/MM/yyyy'),
      format(new Date(m.startTime), 'HH:mm'),
      format(new Date(m.endTime), 'HH:mm'),
      escapeCsv(m.location),
      rateTypeLabel(m.rateType),
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

  const downloadCompletedReportMD = () => {
    if (allCompletedMissions.length === 0) {
      alert("Aucune mission terminée à exporter.");
      return;
    }

    const totalEarnings = allCompletedMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
    const totalHours = allCompletedMissions.reduce((acc, m) => {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0);
    const averageRate = totalHours > 0 ? (totalEarnings / totalHours) : 0;

    // Calculer les statistiques par client
    const clientStats = new Map<string, { count: number; earnings: number }>();
    allCompletedMissions.forEach(m => {
      const existing = clientStats.get(m.client) || { count: 0, earnings: 0 };
      clientStats.set(m.client, {
        count: existing.count + 1,
        earnings: existing.earnings + (m.totalEarnings || 0)
      });
    });

    let mdContent = `# 📋 Rapport des Missions Terminées\n\n`;
    mdContent += `\`\`\`\n`;
    mdContent += `═══════════════════════════════════════════════════════════════\n`;
    mdContent += `  NEUROTIME - RAPPORT D'ACTIVITÉ\n`;
    mdContent += `═══════════════════════════════════════════════════════════════\n`;
    mdContent += `\`\`\`\n\n`;

    mdContent += `**📅 Date d'export :** ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}\n\n`;

    mdContent += `## 📊 Vue d'ensemble\n\n`;
    mdContent += `| Métrique | Valeur |\n`;
    mdContent += `|:---------|:-------:|\n`;
    mdContent += `| **Nombre de missions** | **${allCompletedMissions.length}** |\n`;
    mdContent += `| **Total des gains** | **${totalEarnings.toFixed(2)} €** |\n`;
    mdContent += `| **Total des heures** | **${totalHours.toFixed(2)}h** |\n`;
    mdContent += `| **Taux horaire moyen** | **${averageRate.toFixed(2)} €/h** |\n`;
    mdContent += `| **Nombre de clients** | **${clientStats.size}** |\n\n`;

    mdContent += `---\n\n`;

    mdContent += `## 📈 Statistiques par Client\n\n`;
    const sortedClients = Array.from(clientStats.entries())
      .sort((a, b) => b[1].earnings - a[1].earnings);
    
    sortedClients.forEach(([client, stats]) => {
      mdContent += `- **${client}** : ${stats.count} mission${stats.count > 1 ? 's' : ''} - ${stats.earnings.toFixed(2)} €\n`;
    });
    mdContent += `\n---\n\n`;

    mdContent += `## 📝 Détail des Missions\n\n`;
    mdContent += `| Date | Créneaux | Mission | Client | Lieu | Type | Taux/h | Total | H. jour | H. nuit |\n`;
    mdContent += `|:-----|:---------|:--------|:-------|:-----|:-----|:------:|:-----:|:------:|:-------:|\n`;

    allCompletedMissions
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .forEach((m, index) => {
        const date = format(new Date(m.startTime), 'dd/MM/yyyy', { locale: fr });
        const slots = formatTimeSlots(m);
        const mission = m.title.replace(/\|/g, '\\|').substring(0, 30);
        const client = m.client.replace(/\|/g, '\\|').substring(0, 20);
        const location = m.location.replace(/\|/g, '\\|').substring(0, 20);
        const rateType = rateTypeLabel(m.rateType);
        const hourlyRate = m.hourlyRate || 0;
        const total = m.totalEarnings?.toFixed(2) || '0.00';
        const dayHours = m.details?.dayHours?.toFixed(1) || '-';
        const nightHours = m.details?.nightHours?.toFixed(1) || '-';

        mdContent += `| ${date} | ${slots} | ${mission}${mission.length >= 30 ? '...' : ''} | ${client}${client.length >= 20 ? '...' : ''} | ${location}${location.length >= 20 ? '...' : ''} | ${rateType} | ${hourlyRate} | **${total}** | ${dayHours} | ${nightHours} |\n`;
      });

    mdContent += `\n---\n\n`;

    mdContent += `## 💰 Résumé Financier\n\n`;
    mdContent += `| Description | Montant |\n`;
    mdContent += `|:------------|:-------:|\n`;
    mdContent += `| **Total des gains réalisés** | **${totalEarnings.toFixed(2)} €** |\n`;
    mdContent += `| Nombre total d'heures | ${totalHours.toFixed(2)}h |\n`;
    mdContent += `| Taux horaire moyen | ${averageRate.toFixed(2)} €/h |\n`;
    mdContent += `| Nombre de missions | ${allCompletedMissions.length} |\n\n`;

    mdContent += `---\n\n`;
    mdContent += `*Document généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })} par NeuroTime*\n`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `missions_terminees_${format(new Date(), 'yyyy-MM-dd')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCompletedReportPDF = () => {
    if (allCompletedMissions.length === 0) {
      alert("Aucune mission terminée à exporter.");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const headerHeight = 40;
      let currentPage = 1;

      // Fonction pour dessiner l'en-tête
      const drawHeader = (yPos: number) => {
        // Barre colorée en haut
        doc.setFillColor(59, 130, 246); // Bleu primary
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        
        // Titre
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('RAPPORT DES MISSIONS TERMINÉES', pageWidth / 2, 18, { align: 'center' });
        
        // Sous-titre
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('NeuroTime - Activité Professionnelle', pageWidth / 2, 28, { align: 'center' });
        
        // Date
        doc.setFontSize(9);
        doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, 35, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        return headerHeight + 5;
      };

      // Fonction pour dessiner le pied de page
      const drawFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 10;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
        doc.text('NeuroTime - Document confidentiel', pageWidth - margin, footerY, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      };

      // Calculer les statistiques
      const totalEarnings = allCompletedMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
      const totalHours = allCompletedMissions.reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);
      const averageRate = totalHours > 0 ? (totalEarnings / totalHours) : 0;

      // Première page - En-tête et statistiques
      let yPos = drawHeader(0);

      // Section statistiques avec encadrés
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Vue d\'ensemble', margin, yPos);
      yPos += 8;

      const statsBoxHeight = 25;
      const statsBoxWidth = (pageWidth - 2 * margin - 10) / 4;
      const statsY = yPos;

      // Box 1: Nombre de missions
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Missions', margin + 5, statsY + 7);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(allCompletedMissions.length.toString(), margin + 5, statsY + 16);

      // Box 2: Total gains
      doc.setFillColor(240, 240, 240);
      doc.rect(margin + statsBoxWidth + 5, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + statsBoxWidth + 5, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Total gains', margin + statsBoxWidth + 10, statsY + 7);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${totalEarnings.toFixed(2)} €`, margin + statsBoxWidth + 10, statsY + 16);

      // Box 3: Total heures
      doc.setFillColor(240, 240, 240);
      doc.rect(margin + (statsBoxWidth + 5) * 2, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + (statsBoxWidth + 5) * 2, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Total heures', margin + (statsBoxWidth + 5) * 2 + 5, statsY + 7);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${totalHours.toFixed(1)}h`, margin + (statsBoxWidth + 5) * 2 + 5, statsY + 16);

      // Box 4: Taux moyen
      doc.setFillColor(240, 240, 240);
      doc.rect(margin + (statsBoxWidth + 5) * 3, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + (statsBoxWidth + 5) * 3, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Taux moyen', margin + (statsBoxWidth + 5) * 3 + 5, statsY + 7);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${averageRate.toFixed(2)} €/h`, margin + (statsBoxWidth + 5) * 3 + 5, statsY + 16);

      yPos = statsY + statsBoxHeight + 15;

      // Section détail des missions
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Détail des Missions', margin, yPos);
      yPos += 8;

      // Tableau avec bordures
      const colWidths = [22, 28, 40, 35, 30, 25];
      const headers = ['Date', 'Créneaux', 'Mission', 'Client', 'Lieu', 'Total (€)'];
      const startX = margin;
      const tableTopY = yPos;

      // En-têtes du tableau avec fond coloré
      doc.setFillColor(59, 130, 246);
      doc.rect(startX, tableTopY, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      let xPos = startX + 2;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTopY + 6);
        xPos += colWidths[i];
      });

      yPos = tableTopY + 10;
      doc.setTextColor(0, 0, 0);

      // Données du tableau
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      const sortedMissions = [...allCompletedMissions].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      sortedMissions.forEach((m, index) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPos > pageHeight - 35) {
          drawFooter(currentPage, 0); // On ne connaît pas encore le total
          doc.addPage();
          currentPage++;
          yPos = drawHeader(0) + 5;
          
          // Redessiner les en-têtes du tableau
          doc.setFillColor(59, 130, 246);
          doc.rect(startX, yPos, pageWidth - 2 * margin, 8, 'F');
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(255, 255, 255);
          xPos = startX + 2;
          headers.forEach((header, i) => {
            doc.text(header, xPos, yPos + 6);
            xPos += colWidths[i];
          });
          yPos += 10;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
        }

        // Fond alterné pour les lignes
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(startX, yPos - 4, pageWidth - 2 * margin, 6, 'F');
        }

        const date = format(new Date(m.startTime), 'dd/MM/yyyy', { locale: fr });
        const slots = formatTimeSlots(m);
        const mission = doc.splitTextToSize(m.title, colWidths[2] - 4);
        const client = doc.splitTextToSize(m.client, colWidths[3] - 4);
        const location = doc.splitTextToSize(m.location, colWidths[4] - 4);
        const total = m.totalEarnings?.toFixed(2) || '0.00';

        const maxLines = Math.max(mission.length, client.length, location.length, 1);
        const cellHeight = maxLines * 5;

        // Bordures verticales
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        xPos = startX;
        doc.line(xPos, yPos - 4, xPos, yPos + cellHeight - 4);
        headers.forEach((_, i) => {
          xPos += colWidths[i];
          doc.line(xPos, yPos - 4, xPos, yPos + cellHeight - 4);
        });

        // Texte des cellules
        xPos = startX + 2;
        doc.text(date, xPos, yPos);
        xPos += colWidths[0];
        doc.text(slots, xPos, yPos);
        xPos += colWidths[1];
        doc.text(mission, xPos, yPos);
        xPos += colWidths[2];
        doc.text(client, xPos, yPos);
        xPos += colWidths[3];
        doc.text(location, xPos, yPos);
        xPos += colWidths[4];
        doc.setFont(undefined, 'bold');
        doc.text(total, xPos, yPos);
        doc.setFont(undefined, 'normal');

        // Ligne horizontale
        doc.setDrawColor(200, 200, 200);
        doc.line(startX, yPos + cellHeight - 4, pageWidth - margin, yPos + cellHeight - 4);

        yPos += cellHeight;
      });

      // Ligne de total
      yPos += 5;
      if (yPos > pageHeight - 30) {
        drawFooter(currentPage, 0);
        doc.addPage();
        currentPage++;
        yPos = drawHeader(0) + 5;
      }
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F');
      doc.text(`TOTAL GÉNÉRAL : ${totalEarnings.toFixed(2)} €`, pageWidth - margin, yPos, { align: 'right' });

      // Dessiner le pied de page sur toutes les pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
      }

      // Sauvegarder
      doc.save(`missions_terminees_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-50 tracking-tight mb-2">Tableau de bord</h1>
          <p className="text-gray-300 text-sm md:text-base font-medium">Vue d'ensemble de votre activité</p>
          <div className="mt-3 inline-flex items-center gap-2.5 rounded-full bg-primary-500/12 border border-primary-500/30 px-4 py-1.5 text-xs text-primary-100 font-medium shadow-md shadow-primary-500/8">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/40" />
            Mise à jour temps réel sur vos missions planifiées et réalisées
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button 
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 glass-button text-gray-200 px-5 py-2.5 rounded-xl font-medium transition-all text-sm shadow-md"
            title="Exporter pour Excel"
          >
            <Download size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">Exporter CSV</span>
            <span className="md:hidden">CSV</span>
          </button>
          <button 
            onClick={downloadCompletedReportMD}
            className="flex items-center justify-center gap-2 glass-button text-gray-200 px-5 py-2.5 rounded-xl font-medium transition-all text-sm shadow-md"
            title="Exporter les missions terminées en Markdown"
          >
            <FileText size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">Export MD</span>
            <span className="md:hidden">MD</span>
          </button>
          <button 
            onClick={downloadCompletedReportPDF}
            className="flex items-center justify-center gap-2 glass-button text-gray-200 px-5 py-2.5 rounded-xl font-medium transition-all text-sm shadow-md"
            title="Exporter les missions terminées en PDF (pour paiement)"
          >
            <File size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">Export PDF</span>
            <span className="md:hidden">PDF</span>
          </button>
        </div>
      </header>

      {/* Vue d'ensemble rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 animate-slide-in-up mb-6">
        <div className="glass-card rounded-2xl p-5 md:p-6 border border-primary-500/20 bg-gradient-to-br from-primary-600/20 via-primary-500/12 to-primary-400/8 hover:from-primary-600/25 hover:via-primary-500/18 hover:to-primary-400/12 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/20 border border-primary-500/40 shadow-md shadow-primary-500/15">
                <Clock className="w-5 h-5 text-primary-200" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-semibold text-primary-100 tracking-wide">Aujourd'hui</p>
            </div>
            <span className="text-xs font-medium text-gray-200 bg-primary-500/15 border border-primary-500/30 px-2.5 py-1 rounded-full">{todayMissions.length} mission(s)</span>
          </div>
          <p className="text-3xl md:text-4xl font-black text-gray-50 mb-2 tracking-tight">{todayHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-300 font-medium">Temps prévu ou réalisé sur la journée</p>
        </div>

        <div className="glass-card rounded-2xl p-5 md:p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-600/18 via-emerald-500/12 to-emerald-400/8 hover:from-emerald-600/22 hover:via-emerald-500/18 hover:to-emerald-400/12 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 shadow-md shadow-emerald-500/15">
                <TrendingUp className="w-5 h-5 text-emerald-200" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-semibold text-emerald-100 tracking-wide">Cette semaine</p>
            </div>
            <span className="text-xs font-medium text-gray-200 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">{thisWeekMissions.length} mission(s)</span>
          </div>
          <p className="text-3xl md:text-4xl font-black text-gray-50 mb-2 tracking-tight">{thisWeekHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-300 font-medium">Charge totale entre lundi et dimanche</p>
        </div>

        <div className="glass-card rounded-2xl p-5 md:p-6 border border-orange-500/20 bg-gradient-to-br from-orange-600/18 via-orange-500/12 to-orange-400/8 hover:from-orange-600/22 hover:via-orange-500/18 hover:to-orange-400/12 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 shadow-md shadow-orange-500/15">
                <Calendar className="w-5 h-5 text-orange-200" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-semibold text-orange-100 tracking-wide">Prochaine mission</p>
            </div>
            {nextMission ? (
              <span className="text-xs font-medium text-orange-100 bg-orange-500/20 border border-orange-500/40 px-2.5 py-1 rounded-full shadow-sm">
                {format(new Date(nextMission.startTime), 'dd MMM', { locale: fr })}
              </span>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
          {nextMission ? (
            <div className="mt-3 space-y-2">
              <p className="text-lg md:text-xl font-bold text-gray-50 line-clamp-1 tracking-tight">{nextMission.title}</p>
              <p className="text-sm text-gray-300 flex items-center gap-2 font-medium">
                <Clock size={14} className="text-gray-400" strokeWidth={2} />
                {format(new Date(nextMission.startTime), 'HH:mm')} • {nextMission.location}
              </p>
              <p className="text-xs text-gray-400 font-medium">
                {nextMission.rateType === 'night' ? 'Mission de nuit' : 'Mission de jour'} · {nextMission.totalEarnings?.toFixed(0) ?? 0}€
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400 font-medium">Aucune mission planifiée. Ajoutez-en une pour rester prêt.</p>
          )}
        </div>
      </div>

      {/* AI Summary Card */}
      <div className="glass-card bg-primary-500/10 rounded-2xl p-6 md:p-8 text-gray-100 relative overflow-hidden animate-slide-in-up mb-6 border-primary-500/20">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary-500/20 p-2 rounded-xl border border-primary-500/30 shadow-md">
                 <SparklesIcon className="w-5 h-5 text-primary-400" />
              </span>
              <h3 className="font-bold text-lg md:text-xl tracking-wide text-primary-400">Assistant Intelligent</h3>
            </div>
            <button
              type="button"
              onClick={refreshSummary}
              disabled={isSummaryLoading || missions.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass-button text-xs md:text-sm font-semibold text-primary-300 border border-primary-500/30 hover:border-primary-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rafraîchir l'analyse IA"
            >
              <RefreshCcw className={`w-4 h-4 ${isSummaryLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSummaryLoading ? 'Analyse...' : 'Rafraîchir'}</span>
            </button>
          </div>
          <p className="text-gray-100 leading-relaxed text-sm md:text-base font-medium max-w-2xl">{summary}</p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
          icon={<Euro className="w-6 h-6 text-emerald-400" />}
          label="CA ce mois"
          value={`${totalEarnings.toFixed(0)} €`}
          subtext={`Réalisé: ${totalEarningsCompleted.toFixed(0)}€ ${totalEarningsPlanned > 0 ? `+ Prévisionnel: ${totalEarningsPlanned.toFixed(0)}€` : ''}`}
          color="bg-emerald-500/10 border-emerald-500/30"
          textColor="text-emerald-400"
          trend={monthlyComparison.percentage !== 0 ? {
            value: Math.abs(monthlyComparison.percentage),
            isPositive: monthlyComparison.isPositive,
          } : undefined}
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-primary-400" />}
          label="Heures totales"
          value={`${totalHours.toFixed(1)} h`}
          subtext="Cumul mensuel (missions terminées)"
          color="bg-primary-500/10 border-primary-500/30"
          textColor="text-primary-400"
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-purple-400" />}
          label="Missions finies"
          value={allCompletedMissions.length.toString()}
          subtext={`${thisMonthCompletedMissions.length} ce mois`}
          color="bg-purple-500/10 border-purple-500/30"
          textColor="text-purple-400"
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-orange-400" />}
          label="À venir"
          value={upcomingMissions.length.toString()}
          subtext="À planifier / valider"
          color="bg-orange-500/10 border-orange-500/30"
          textColor="text-orange-400"
        />
      </div>

      {/* KPIs Avancés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard 
          icon={<DollarSign className="w-5 h-5 text-blue-400" />}
          label="Taux horaire moyen"
          value={`${averageHourlyRate.toFixed(2)} €/h`}
          subtext="Revenus moyens par heure"
          color="bg-blue-500/10 border-blue-500/30"
          textColor="text-blue-400"
        />
        <StatCard 
          icon={monthlyComparison.isPositive ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          label="Évolution mensuelle"
          value={`${monthlyComparison.isPositive ? '+' : ''}${monthlyComparison.percentage.toFixed(1)}%`}
          subtext={`vs mois précédent (${monthlyComparison.lastMonth.toFixed(0)}€)`}
          color={monthlyComparison.isPositive ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}
          textColor={monthlyComparison.isPositive ? "text-green-400" : "text-red-400"}
        />
        {mostProfitableMission && (
          <StatCard 
            icon={<Award className="w-5 h-5 text-yellow-400" />}
            label="Mission la plus rentable"
            value={`${mostProfitableMission.totalEarnings?.toFixed(0) || 0} €`}
            subtext={mostProfitableMission.title}
            color="bg-yellow-500/10 border-yellow-500/30"
            textColor="text-yellow-400"
          />
        )}
      </div>

      {/* Graphiques */}
      <DashboardCharts missions={missions} />

      {/* Statistiques avancées et Objectifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardStats missions={missions} />
        <DashboardGoals missions={missions} />
      </div>

      {/* Activité récente */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <button
          onClick={() => setIsActivityExpanded(!isActivityExpanded)}
          className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-100">Activité récente</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm text-gray-400">
              {isActivityExpanded ? 'Réduire' : 'Déplier'}
            </span>
            {isActivityExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        {isActivityExpanded && (
          <div className="animate-slide-in-up">
            <DashboardActivity missions={missions} onEdit={onEdit} />
          </div>
        )}
      </div>

      {/* Upcoming / Planned Missions List */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <button
          onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
          className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2.5">
            <span className="bg-dark-100 p-2 rounded-lg border border-dark-200 group-hover:border-primary-500/50 transition-colors">
               <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-400" />
            </span>
            <h3 className="text-lg md:text-xl font-bold text-gray-100">À venir</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm text-gray-300 font-medium bg-dark-100 px-2.5 py-1 rounded-full border border-dark-200">
              {upcomingMissions.length} en attente
            </span>
            <span className="text-xs md:text-sm text-gray-400">
              {isUpcomingExpanded ? 'Réduire' : 'Déplier'}
            </span>
            {isUpcomingExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        
        {isUpcomingExpanded && (
          <div className="animate-slide-in-up">
            {upcomingMissions.length === 0 ? (
          <div className="text-center py-10 md:py-12 glass-light rounded-xl border border-dashed border-primary-500/20">
            <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-dark-50 rounded-full flex items-center justify-center shadow-sm mb-3 border border-dark-200">
              <CheckCircle className="text-green-400" size={20} />
            </div>
            <p className="text-gray-300 font-medium text-sm md:text-base">Tout est à jour !</p>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Aucune mission en attente</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {upcomingMissions.map((mission, index) => (
              <div key={mission.id} className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl glass-light hover:border-primary-500/30 hover:shadow-lg transition-all duration-200 animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                
                {/* Date Badge */}
                <div 
                  onClick={() => onEdit(mission)}
                  className="flex cursor-pointer md:flex-col items-center gap-2 md:gap-0 bg-dark-50 p-2.5 md:p-3 rounded-lg min-w-[70px] md:min-w-[80px] text-center border border-dark-200 group-hover:bg-primary-500/20 group-hover:border-primary-500/50 transition-all duration-300 shadow-sm relative z-10 group-hover:scale-105"
                >
                  <div className="text-[10px] md:text-xs text-gray-400 group-hover:text-primary-300 uppercase font-bold tracking-wider">
                    {format(new Date(mission.startTime), 'MMM', { locale: fr })}
                  </div>
                  <div className="text-xl md:text-2xl font-black text-gray-100 group-hover:text-primary-300 leading-none md:mt-1">
                    {format(new Date(mission.startTime), 'dd')}
                  </div>
                  <div className="md:hidden h-6 w-[1px] bg-dark-200 mx-2"></div>
                  <div className="md:hidden text-base font-bold text-gray-200">
                     {format(new Date(mission.startTime), 'HH:mm')}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(mission)}>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-100 text-base md:text-lg truncate group-hover:text-primary-300 transition-colors">{mission.title}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex-shrink-0">
                       {mission.totalEarnings?.toFixed(0)}€
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-y-1.5 gap-x-3 mt-2 text-xs md:text-sm text-gray-400">
                    <span className="flex items-center gap-1.5 bg-dark-50 px-2 py-0.5 rounded-md border border-dark-200">
                      <Clock size={12} className="text-gray-500" />
                      {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-500" />
                      <span className="truncate max-w-[150px]">{mission.location}</span>
                    </span>
                     <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium">
                       {mission.rateType === 'night' ? <Moon size={10} className="text-primary-400" /> : <Sun size={10} className="text-orange-400" />}
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
                    className="flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg font-semibold text-xs md:text-sm transition-all shadow-sm"
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
        )}
      </div>

      {/* Completed Missions List */}
      <div className="glass-card rounded-2xl p-4 md:p-6 animate-slide-in-up">
        <button
          onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
          className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2.5">
            <span className="bg-dark-100 p-2 rounded-lg border border-dark-200 group-hover:border-green-500/50 transition-colors">
               <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
            </span>
            <h3 className="text-lg md:text-xl font-bold text-gray-100">Missions terminées</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm text-gray-300 font-medium bg-dark-100 px-2.5 py-1 rounded-full border border-dark-200">
              {allCompletedMissions.length} au total
            </span>
            <span className="text-xs md:text-sm text-gray-400">
              {isCompletedExpanded ? 'Réduire' : 'Déplier'}
            </span>
            {isCompletedExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        
        {isCompletedExpanded && (
          <div className="animate-slide-in-up">
            {recentCompletedMissions.length === 0 ? (
          <div className="text-center py-10 md:py-12 glass-light rounded-xl border border-dashed border-primary-500/20">
            <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-dark-50 rounded-full flex items-center justify-center shadow-sm mb-3 border border-dark-200">
              <CheckCircle className="text-gray-500" size={20} />
            </div>
            <p className="text-gray-300 font-medium text-sm md:text-base">Aucune mission terminée</p>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Les missions terminées apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentCompletedMissions.map((mission, index) => (
              <div key={mission.id} className="group flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl glass-light hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 animate-slide-in-up relative overflow-hidden" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                
                {/* Date Badge */}
                <div 
                  onClick={() => onEdit(mission)}
                  className="flex cursor-pointer md:flex-col items-center gap-2 md:gap-0 bg-dark-50 p-2.5 md:p-3 rounded-lg min-w-[70px] md:min-w-[80px] text-center border border-dark-200 group-hover:bg-green-500/20 group-hover:border-green-500/50 transition-all duration-300 shadow-sm relative z-10 group-hover:scale-105"
                >
                  <div className="text-[10px] md:text-xs text-gray-400 group-hover:text-green-300 uppercase font-bold tracking-wider">
                    {format(new Date(mission.endTime), 'MMM', { locale: fr })}
                  </div>
                  <div className="text-xl md:text-2xl font-black text-gray-100 group-hover:text-green-300 leading-none md:mt-1">
                    {format(new Date(mission.endTime), 'dd')}
                  </div>
                  <div className="md:hidden h-6 w-[1px] bg-dark-200 mx-2"></div>
                  <div className="md:hidden text-base font-bold text-gray-200">
                     {format(new Date(mission.endTime), 'HH:mm')}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(mission)}>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-100 text-base md:text-lg truncate group-hover:text-green-300 transition-colors">{mission.title}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 flex-shrink-0">
                       {mission.totalEarnings?.toFixed(0)}€
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-y-1.5 gap-x-3 mt-2 text-xs md:text-sm text-gray-400">
                    <span className="flex items-center gap-1.5 bg-dark-50 px-2 py-0.5 rounded-md border border-dark-200">
                      <Clock size={12} className="text-gray-500" />
                      {format(new Date(mission.startTime), 'HH:mm')} - {format(new Date(mission.endTime), 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-500" />
                      <span className="truncate max-w-[150px]">{mission.location}</span>
                    </span>
                     <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium">
                       {mission.rateType === 'night' ? <Moon size={10} className="text-primary-400" /> : <Sun size={10} className="text-orange-400" />}
                       {mission.rateType === 'night' ? 'Nuit' : mission.rateType === 'mixed' ? 'Mixte' : 'Jour'}
                     </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-end md:justify-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckCircle size={12} className="mr-1" />
                    Terminé
                  </span>
                </div>
              </div>
            ))}
          </div>
            )}
          </div>
        )}
      </div>

       {/* Data Persistence Section */}
       <div className="glass-card rounded-2xl p-4 md:p-5 animate-slide-in-up">
          <div className="flex items-center gap-2.5 mb-3">
             <div className="bg-dark-100 p-1.5 rounded-lg text-gray-300 border border-dark-200 group-hover:border-primary-500/50 transition-colors">
               <Database size={18} />
             </div>
             <h3 className="text-base md:text-lg font-bold text-gray-100">Sauvegarde</h3>
          </div>
          <p className="text-xs md:text-sm text-gray-400 mb-4">
            Sauvegardez régulièrement vos données pour éviter toute perte.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button 
              onClick={backupData}
              className="flex items-center justify-center gap-2 glass-button text-gray-200 font-medium py-2.5 px-4 rounded-lg hover:border-primary-500/50 transition-all flex-1 text-sm"
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
                className="w-full flex items-center justify-center gap-2 glass-button text-gray-200 font-medium py-2.5 px-4 rounded-lg hover:border-primary-500/50 transition-all text-sm"
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

const StatCard = memo(({ icon, label, value, subtext, color, textColor, trend }: any) => (
  <div className={`p-5 md:p-6 rounded-2xl glass-card transition-all hover:shadow-lg ${color} group relative animate-slide-in-up shadow-md`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-dark-50/80 shadow-lg border border-dark-100/50 ${textColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${trend.isPositive ? 'text-green-300 bg-green-500/20 border border-green-500/30' : 'text-red-300 bg-red-500/20 border border-red-500/30'}`}>
            {trend.isPositive ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
            {trend.value}%
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight group-hover:scale-105 transition-transform duration-300 mb-1">{value}</p>
        <p className={`text-xs md:text-sm font-bold mt-1 ${textColor} tracking-wide`}>{label}</p>
        <p className="text-[10px] md:text-xs text-gray-300 mt-2 font-medium">{subtext}</p>
      </div>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
  </svg>
);

export default Dashboard;