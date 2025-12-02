import jsPDF from 'jspdf';
import { Invoice, Quote } from '../types';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

// Générer un numéro de facture/devis unique
export const generateDocumentNumber = (prefix: string, year: number, sequence: number): string => {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
};

// Générer un PDF de facture
export const generateInvoicePDF = (invoice: Invoice, userInfo?: { name?: string; address?: string; email?: string; phone?: string }): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Couleurs
  const primaryColor = [59, 130, 246]; // Blue-500
  const darkColor = [30, 41, 59]; // Dark-300
  const grayColor = [148, 163, 184]; // Gray-400

  // En-tête avec bande colorée
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.invoiceNumber}`, pageWidth - margin, 25, { align: 'right' });

  yPos = 50;

  // Informations utilisateur (émetteur)
  if (userInfo) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Émetteur', margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    if (userInfo.name) doc.text(userInfo.name, margin, yPos);
    yPos += 5;
    if (userInfo.address) {
      const addressLines = doc.splitTextToSize(userInfo.address, 80);
      doc.text(addressLines, margin, yPos);
      yPos += addressLines.length * 5;
    }
    if (userInfo.email) {
      doc.text(`Email: ${userInfo.email}`, margin, yPos);
      yPos += 5;
    }
    if (userInfo.phone) {
      doc.text(`Tél: ${userInfo.phone}`, margin, yPos);
      yPos += 5;
    }
  }

  yPos = 50;

  // Informations client
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Client', pageWidth - margin - 80, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.client, pageWidth - margin - 80, yPos);
  yPos += 5;
  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 80);
    doc.text(addressLines, pageWidth - margin - 80, yPos);
    yPos += addressLines.length * 5;
  }
  if (invoice.clientEmail) {
    doc.text(`Email: ${invoice.clientEmail}`, pageWidth - margin - 80, yPos);
  }

  yPos = 100;

  // Dates
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(`Date d'émission: ${format(new Date(invoice.issueDate), 'dd MMMM yyyy', { locale: fr })}`, margin, yPos);
  yPos += 5;
  doc.text(`Date d'échéance: ${format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: fr })}`, margin, yPos);

  yPos += 15;

  // Tableau des articles
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  
  // En-tête du tableau
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin + 2, yPos + 7);
  doc.text('Qté', margin + 100, yPos + 7);
  doc.text('Prix unit.', margin + 120, yPos + 7);
  doc.text('Total', pageWidth - margin - 20, yPos + 7, { align: 'right' });

  yPos += 10;

  // Lignes des articles
  doc.setFont('helvetica', 'normal');
  invoice.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }
    
    const bgColor = index % 2 === 0 ? [255, 255, 255] : [250, 250, 250];
    doc.setFillColor(...bgColor);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    
    const descLines = doc.splitTextToSize(item.description, 80);
    doc.text(descLines, margin + 2, yPos + 5);
    
    doc.text(item.quantity.toString(), margin + 100, yPos + 5);
    doc.text(`${item.unitPrice.toFixed(2)} €`, margin + 120, yPos + 5);
    doc.text(`${item.total.toFixed(2)} €`, pageWidth - margin - 20, yPos + 5, { align: 'right' });
    
    yPos += Math.max(8, descLines.length * 5);
  });

  yPos += 5;

  // Totaux
  const totalsX = pageWidth - margin - 60;
  
  doc.setFontSize(9);
  doc.text('Sous-total HT:', totalsX, yPos, { align: 'right' });
  doc.text(`${invoice.subtotal.toFixed(2)} €`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  if (invoice.tax && invoice.tax > 0) {
    doc.text(`TVA (${invoice.taxRate}%):`, totalsX, yPos, { align: 'right' });
    doc.text(`${invoice.tax.toFixed(2)} €`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, yPos - 2, pageWidth - margin, yPos - 2);
  doc.text('Total TTC:', totalsX, yPos + 5, { align: 'right' });
  doc.text(`${invoice.total.toFixed(2)} €`, pageWidth - margin, yPos + 5, { align: 'right' });

  yPos += 15;

  // Notes
  if (invoice.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    const notesLines = doc.splitTextToSize(`Notes: ${invoice.notes}`, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
  }

  // Statut
  yPos = pageWidth - 20;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée'
  };
  doc.text(`Statut: ${statusLabels[invoice.status] || invoice.status}`, margin, yPos);

  return doc;
};

// Générer un PDF de devis (similaire à la facture)
export const generateQuotePDF = (quote: Quote, userInfo?: { name?: string; address?: string; email?: string; phone?: string }): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Couleurs
  const primaryColor = [34, 197, 94]; // Green-500 pour devis
  const darkColor = [30, 41, 59];
  const grayColor = [148, 163, 184];

  // En-tête
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVIS', margin, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${quote.quoteNumber}`, pageWidth - margin, 25, { align: 'right' });

  yPos = 50;

  // Informations utilisateur
  if (userInfo) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Émetteur', margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    if (userInfo.name) doc.text(userInfo.name, margin, yPos);
    yPos += 5;
    if (userInfo.address) {
      const addressLines = doc.splitTextToSize(userInfo.address, 80);
      doc.text(addressLines, margin, yPos);
      yPos += addressLines.length * 5;
    }
    if (userInfo.email) {
      doc.text(`Email: ${userInfo.email}`, margin, yPos);
      yPos += 5;
    }
    if (userInfo.phone) {
      doc.text(`Tél: ${userInfo.phone}`, margin, yPos);
      yPos += 5;
    }
  }

  yPos = 50;

  // Informations client
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Client', pageWidth - margin - 80, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.text(quote.client, pageWidth - margin - 80, yPos);
  yPos += 5;
  if (quote.clientAddress) {
    const addressLines = doc.splitTextToSize(quote.clientAddress, 80);
    doc.text(addressLines, pageWidth - margin - 80, yPos);
    yPos += addressLines.length * 5;
  }
  if (quote.clientEmail) {
    doc.text(`Email: ${quote.clientEmail}`, pageWidth - margin - 80, yPos);
  }

  yPos = 100;

  // Dates
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(`Date d'émission: ${format(new Date(quote.issueDate), 'dd MMMM yyyy', { locale: fr })}`, margin, yPos);
  yPos += 5;
  doc.text(`Valable jusqu'au: ${format(new Date(quote.validUntil), 'dd MMMM yyyy', { locale: fr })}`, margin, yPos);

  yPos += 15;

  // Tableau des articles (identique à la facture)
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin + 2, yPos + 7);
  doc.text('Qté', margin + 100, yPos + 7);
  doc.text('Prix unit.', margin + 120, yPos + 7);
  doc.text('Total', pageWidth - margin - 20, yPos + 7, { align: 'right' });

  yPos += 10;

  doc.setFont('helvetica', 'normal');
  quote.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }
    
    const bgColor = index % 2 === 0 ? [255, 255, 255] : [250, 250, 250];
    doc.setFillColor(...bgColor);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    
    const descLines = doc.splitTextToSize(item.description, 80);
    doc.text(descLines, margin + 2, yPos + 5);
    
    doc.text(item.quantity.toString(), margin + 100, yPos + 5);
    doc.text(`${item.unitPrice.toFixed(2)} €`, margin + 120, yPos + 5);
    doc.text(`${item.total.toFixed(2)} €`, pageWidth - margin - 20, yPos + 5, { align: 'right' });
    
    yPos += Math.max(8, descLines.length * 5);
  });

  yPos += 5;

  // Totaux
  const totalsX = pageWidth - margin - 60;
  
  doc.setFontSize(9);
  doc.text('Sous-total HT:', totalsX, yPos, { align: 'right' });
  doc.text(`${quote.subtotal.toFixed(2)} €`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  if (quote.tax && quote.tax > 0) {
    doc.text(`TVA (${quote.taxRate}%):`, totalsX, yPos, { align: 'right' });
    doc.text(`${quote.tax.toFixed(2)} €`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, yPos - 2, pageWidth - margin, yPos - 2);
  doc.text('Total TTC:', totalsX, yPos + 5, { align: 'right' });
  doc.text(`${quote.total.toFixed(2)} €`, pageWidth - margin, yPos + 5, { align: 'right' });

  yPos += 15;

  // Notes
  if (quote.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...grayColor);
    const notesLines = doc.splitTextToSize(`Notes: ${quote.notes}`, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
  }

  // Statut
  yPos = pageWidth - 20;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré'
  };
  doc.text(`Statut: ${statusLabels[quote.status] || quote.status}`, margin, yPos);

  return doc;
};

