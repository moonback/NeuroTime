import { useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { jsPDF } from 'jspdf';
import { Mission } from '../types';
import { formatTimeSlots } from '../utils/timeSlots';
import { toast } from 'sonner';

export const useDashboardExports = (missions: Mission[], allCompletedMissions: Mission[]) => {

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

  const downloadCSV = useCallback(() => {
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
    link.setAttribute("download", `NeuroTime_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [missions]);

  const downloadCompletedReportMD = useCallback(() => {
    const now = new Date();
    const monthStartTime = startOfMonth(now).getTime();
    const monthEndTime = endOfMonth(now).getTime();

    const currentMonthMissions = allCompletedMissions.filter(m => {
      const missionEndTime = new Date(m.endTime).getTime();
      return missionEndTime >= monthStartTime && missionEndTime <= monthEndTime;
    });

    if (currentMonthMissions.length === 0) {
      toast.info('Aucune mission terminée ce mois à exporter.');
      return;
    }

    const totalEarnings = currentMonthMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
    const totalHours = currentMonthMissions.reduce((acc, m) => {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0);
    const averageRate = totalHours > 0 ? (totalEarnings / totalHours) : 0;

    // Calculer les statistiques par client
    const clientStats = new Map<string, { count: number; earnings: number }>();
    currentMonthMissions.forEach(m => {
      const existing = clientStats.get(m.client) || { count: 0, earnings: 0 };
      clientStats.set(m.client, {
        count: existing.count + 1,
        earnings: existing.earnings + (m.totalEarnings || 0)
      });
    });

    const currentMonthLabel = format(now, 'MMMM yyyy', { locale: fr });

    let mdContent = `# 📋 Rapport des Missions Terminées - ${currentMonthLabel}\n\n`;
    mdContent += `\`\`\`\n`;
    mdContent += `═══════════════════════════════════════════════════════════════\n`;
    mdContent += `  NEUROTIME - RAPPORT D'ACTIVITÉ\n`;
    mdContent += `═══════════════════════════════════════════════════════════════\n`;
    mdContent += `\`\`\`\n\n`;

    mdContent += `**📅 Date d'export :** ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}\n\n`;

    mdContent += `## 📊 Vue d'ensemble\n\n`;
    mdContent += `| Métrique | Valeur |\n`;
    mdContent += `|:---------|:-------:|\n`;
    mdContent += `| **Nombre de missions** | **${currentMonthMissions.length}** |\n`;
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

    currentMonthMissions
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
    mdContent += `| Nombre de missions | ${currentMonthMissions.length} |\n\n`;

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
  }, [allCompletedMissions]);

  const downloadCompletedReportPDF = useCallback(() => {
    try {
      const now = new Date();
      const monthStartTime = startOfMonth(now).getTime();
      const monthEndTime = endOfMonth(now).getTime();
      const monthLabel = format(now, 'MMMM yyyy', { locale: fr });

      const currentMonthMissions = allCompletedMissions.filter(m => {
        const missionEndTime = new Date(m.endTime).getTime();
        return missionEndTime >= monthStartTime && missionEndTime <= monthEndTime;
      });

      if (currentMonthMissions.length === 0) {
        toast.info('Aucune mission terminée ce mois à exporter.');
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const headerHeight = 40;
      let currentPage = 1;

      // Fonction pour dessiner l'en-tête (bandeau corporate sombre + accent)
      const drawHeader = (yPos: number) => {
        // Barre principale (bleu nuit)
        doc.setFillColor(15, 23, 42); // #0F172A
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        // Liseré inférieur accent (bleu primaire)
        doc.setFillColor(59, 130, 246); // #3B82F6
        doc.rect(0, headerHeight - 4, pageWidth, 4, 'F');
        
        // Titre
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('RAPPORT DES MISSIONS TERMINÉES', pageWidth / 2, 18, { align: 'center' });
        
        // Sous-titre
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('NeuroTime - Activité Professionnelle', pageWidth / 2, 26, { align: 'center' });

        // Mois concerné
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Mois de ${monthLabel}`, pageWidth / 2, 32, { align: 'center' });
        
        // Date de génération
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Généré le ${format(now, 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, 38, { align: 'center' });
        
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

      // Calculer les statistiques (heures globales + répartition jour/nuit)
      const totalEarnings = currentMonthMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
      const totalHours = currentMonthMissions.reduce((acc, m) => {
        const start = new Date(m.startTime).getTime();
        const end = new Date(m.endTime).getTime();
        return acc + (end - start) / (1000 * 60 * 60);
      }, 0);
      const averageRate = totalHours > 0 ? (totalEarnings / totalHours) : 0;
      const totalDayHours = currentMonthMissions.reduce(
        (acc, m) => acc + (m.details?.dayHours || 0),
        0
      );
      const totalNightHours = currentMonthMissions.reduce(
        (acc, m) => acc + (m.details?.nightHours || 0),
        0
      );

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
      doc.setFillColor(239, 246, 255); // bleu très clair
      doc.rect(margin, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Missions (mois en cours)', margin + 5, statsY + 7);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(currentMonthMissions.length.toString(), margin + 5, statsY + 16);

      // Box 2: Heures de jour
      doc.setFillColor(249, 250, 251); // gris très clair
      doc.rect(margin + statsBoxWidth + 5, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + statsBoxWidth + 5, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Heures jour', margin + statsBoxWidth + 10, statsY + 7);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${totalDayHours.toFixed(1)}h`, margin + statsBoxWidth + 10, statsY + 16);

      // Box 3: Heures de nuit
      doc.setFillColor(249, 250, 251);
      doc.rect(margin + (statsBoxWidth + 5) * 2, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + (statsBoxWidth + 5) * 2, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Heures nuit', margin + (statsBoxWidth + 5) * 2 + 5, statsY + 7);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${totalNightHours.toFixed(1)}h`, margin + (statsBoxWidth + 5) * 2 + 5, statsY + 16);

      // Box 4: Total heures (toutes)
      doc.setFillColor(249, 250, 251);
      doc.rect(margin + (statsBoxWidth + 5) * 3, statsY, statsBoxWidth, statsBoxHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin + (statsBoxWidth + 5) * 3, statsY, statsBoxWidth, statsBoxHeight, 'S');
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Total heures', margin + (statsBoxWidth + 5) * 3 + 5, statsY + 7);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${totalHours.toFixed(1)}h`, margin + (statsBoxWidth + 5) * 3 + 5, statsY + 16);

      yPos = statsY + statsBoxHeight + 15;

      // Section détail des missions
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Détail des Missions', margin, yPos);
      yPos += 8;

      // Tableau avec bordures (sans colonnes tarifaires)
      // Largeurs ajustées pour rester dans la zone de page (somme = pageWidth - 2 * margin)
      const colWidths = [20, 25, 45, 35, 35, 20];
      const headers = ['Date', 'Créneaux', 'Mission', 'Client', 'Lieu', 'Statut'];
      const startX = margin;
      const tableTopY = yPos;

      // En-têtes du tableau avec fond coloré
      doc.setFillColor(15, 23, 42); // même bleu nuit que le header
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
      const sortedMissions = [...currentMonthMissions].sort(
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
          doc.setFillColor(249, 250, 251);
          doc.rect(startX, yPos - 4, pageWidth - 2 * margin, 6, 'F');
        }

        const date = format(new Date(m.startTime), 'dd/MM/yyyy', { locale: fr });
        const slotsText = formatTimeSlots(m);
        // Autoriser les créneaux, mission, client et lieu à s'étaler sur plusieurs lignes
        const slots = doc.splitTextToSize(slotsText, colWidths[1] - 4);
        const mission = doc.splitTextToSize(m.title, colWidths[2] - 4);
        const client = doc.splitTextToSize(m.client, colWidths[3] - 4);
        const location = doc.splitTextToSize(m.location, colWidths[4] - 4);
        const status = m.status || '';

        const maxLines = Math.max(slots.length, mission.length, client.length, location.length, 1);
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
        // Statut en vert discret pour signaler la complétion, sans montant
        doc.setFont(undefined, 'bold');
        doc.setTextColor(34, 197, 94);
        doc.text(status || 'terminée', xPos, yPos);
        doc.setTextColor(0, 0, 0);
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

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(245, 249, 255);
      doc.rect(margin, yPos - 6, pageWidth - 2 * margin, 10, 'F');
      // Résumé final sans afficher de montants
      doc.text(
        `Total missions terminées (${monthLabel}) : ${currentMonthMissions.length}`,
        pageWidth - margin,
        yPos,
        { align: 'right' }
      );

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
      toast.error('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  }, [allCompletedMissions]);

  const backupData = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(missions, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `neurotime_backup_${format(new Date(), 'yyyy-MM-dd')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [missions]);

  return {
    downloadCSV,
    downloadCompletedReportMD,
    downloadCompletedReportPDF,
    backupData
  };
};

