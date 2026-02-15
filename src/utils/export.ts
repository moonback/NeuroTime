import { Mission } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

export const exportMissionsToCSV = (missions: Mission[]) => {
    if (missions.length === 0) return;

    // Définition des en-têtes
    const headers = [
        'Date',
        'Titre',
        'Client',
        'Lieu',
        'Statut',
        'Paiement',
        'Taux Horaire',
        'Heures Jour',
        'Heures Nuit',
        'Total Gains (EUR)',
        'Description'
    ];

    // Transformation des données
    const rows = missions.map(m => {
        const date = format(new Date(m.startTime), 'dd/MM/yyyy');
        const status = m.status === 'completed' ? 'Terminé' : m.status === 'planned' ? 'Planifié' : 'Annulé';
        const payment = m.isPaid ? 'Payé' : 'En attente';
        const dayHours = m.details?.dayHours || 0;
        const nightHours = m.details?.nightHours || 0;

        return [
            date,
            `"${m.title.replace(/"/g, '""')}"`,
            `"${m.client.replace(/"/g, '""')}"`,
            `"${m.location.replace(/"/g, '""')}"`,
            status,
            payment,
            m.hourlyRate.toString(),
            dayHours.toString(),
            nightHours.toString(),
            m.totalEarnings.toString(),
            `"${(m.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];
    });

    // Construction du contenu CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Création du Blob et téléchargement
    // Utilisation de BOM pour l'encodage UTF-8 dans Excel
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');

    link.setAttribute('href', url);
    link.setAttribute('download', `NeuroTime_Export_Missions_${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};
