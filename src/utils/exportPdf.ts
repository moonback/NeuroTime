import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Mission } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

export const exportMissionsToPdf = (missions: Mission[], startDate?: Date, endDate?: Date) => {
    if (missions.length === 0) {
        alert("Aucune mission à exporter pour cette période.");
        return;
    }

    const doc = new jsPDF();

    // Titre
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text('Rapport des Missions Terminées', 14, 20);

    // Sous-titre avec la période
    doc.setFontSize(11);
    doc.setTextColor(100);
    if (startDate && endDate) {
        doc.text(`Periode du ${format(startDate, 'dd/MM/yyyy')} au ${format(endDate, 'dd/MM/yyyy')}`, 14, 28);
    } else {
        doc.text(`Toutes les missions terminées`, 14, 28);
    }

    // Total gagné
    const totalEarned = missions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
    const textY = startDate && endDate ? 34 : 34;
    doc.text(`Total genere: ${totalEarned.toFixed(2)} EUR`, 14, textY);

    // Tableau
    const headers = [['Date', 'De', 'A', 'Titre', 'Client', 'H. Jour', 'H. Nuit', 'Montant']];

    // Trier les missions par date croissante
    const sortedMissions = [...missions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const data = sortedMissions.map(m => {
        const isHourly = m.rateType !== 'custom';

        const dayHours = m.details?.dayHours || 0;
        const nightHours = m.details?.nightHours || 0;
        // Si ce n'est pas un tarif horaire (ex: forfait/custom), on n'affiche pas les heures
        const dayHoursStr = (isHourly && dayHours > 0) ? dayHours.toString() : '-';
        const nightHoursStr = (isHourly && nightHours > 0) ? nightHours.toString() : '-';

        // Afficher montant seulement si tarif n'est pas basé sur le taux horaire (ex: forfait/custom)
        const amountStr = isHourly ? '-' : (m.totalEarnings?.toString() || '0');

        return [
            format(new Date(m.startTime), 'dd/MM/yyyy'),
            format(new Date(m.startTime), 'HH:mm'),
            format(new Date(m.endTime), 'HH:mm'),
            m.title,
            m.client,
            dayHoursStr,
            nightHoursStr,
            amountStr
        ];
    });

    autoTable(doc, {
        head: headers,
        body: data,
        startY: textY + 6,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }, // primary-500 equivalent color
        styles: { fontSize: 9 },
    });

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    doc.save(`NeuroTime_Missions_Terminees_${timestamp}.pdf`);
};
