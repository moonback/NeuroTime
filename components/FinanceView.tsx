import React, { useState, useEffect } from 'react';
import { Invoice, Quote, Payment, Mission } from '../types';
import { FileText, Receipt, CreditCard, BarChart3, TrendingUp, Download, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, Euro } from 'lucide-react';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { loadInvoices, saveInvoice, deleteInvoice } from '../services/financialService';
import { loadQuotes, saveQuote, deleteQuote } from '../services/financialService';
import { loadPayments, savePayment, deletePayment, loadPaymentsByInvoice } from '../services/financialService';
import { generateFinancialReport } from '../services/financialService';
import { generateInvoicePDF, generateQuotePDF, generateDocumentNumber } from '../services/pdfService';
import { useToast } from './Toast';
import InvoiceForm from './InvoiceForm';
import QuoteForm from './QuoteForm';
import PaymentForm from './PaymentForm';
import FinancialCharts from './FinancialCharts';

type FinanceTab = 'invoices' | 'quotes' | 'payments' | 'reports' | 'charts';

interface FinanceViewProps {
  missions: Mission[];
}

const FinanceView: React.FC<FinanceViewProps> = ({ missions }) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<string | null>(null);
  
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invoicesData, quotesData, paymentsData] = await Promise.all([
        loadInvoices(),
        loadQuotes(),
        loadPayments()
      ]);
      setInvoices(invoicesData);
      setQuotes(quotesData);
      setPayments(paymentsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données financières');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      await saveInvoice(invoice);
      await loadData();
      setIsInvoiceFormOpen(false);
      setEditingInvoice(null);
      toast.success('Facture enregistrée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde de la facture');
    }
  };

  const handleSaveQuote = async (quote: Quote) => {
    try {
      await saveQuote(quote);
      await loadData();
      setIsQuoteFormOpen(false);
      setEditingQuote(null);
      toast.success('Devis enregistré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du devis');
    }
  };

  const handleSavePayment = async (payment: Payment) => {
    try {
      await savePayment(payment);
      await loadData();
      setIsPaymentFormOpen(false);
      setEditingPayment(null);
      setSelectedInvoiceForPayment(null);
      toast.success('Paiement enregistré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du paiement');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await deleteInvoice(id);
        await loadData();
        toast.success('Facture supprimée');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      try {
        await deleteQuote(id);
        await loadData();
        toast.success('Devis supprimé');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await deletePayment(id);
        await loadData();
        toast.success('Paiement supprimé');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleGenerateInvoicePDF = (invoice: Invoice) => {
    try {
      const pdf = generateInvoicePDF(invoice);
      pdf.save(`facture-${invoice.invoiceNumber}.pdf`);
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleGenerateQuotePDF = (quote: Quote) => {
    try {
      const pdf = generateQuotePDF(quote);
      pdf.save(`devis-${quote.quoteNumber}.pdf`);
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const getStatusBadge = (status: string, type: 'invoice' | 'quote' | 'payment') => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      // Invoice statuses
      draft: { label: 'Brouillon', color: 'bg-gray-500/20 text-gray-300', icon: <FileText size={14} /> },
      sent: { label: 'Envoyée', color: 'bg-blue-500/20 text-blue-300', icon: <Clock size={14} /> },
      paid: { label: 'Payée', color: 'bg-green-500/20 text-green-300', icon: <CheckCircle size={14} /> },
      overdue: { label: 'En retard', color: 'bg-red-500/20 text-red-300', icon: <XCircle size={14} /> },
      cancelled: { label: 'Annulée', color: 'bg-gray-500/20 text-gray-400', icon: <XCircle size={14} /> },
      // Quote statuses
      accepted: { label: 'Accepté', color: 'bg-green-500/20 text-green-300', icon: <CheckCircle size={14} /> },
      rejected: { label: 'Refusé', color: 'bg-red-500/20 text-red-300', icon: <XCircle size={14} /> },
      expired: { label: 'Expiré', color: 'bg-orange-500/20 text-orange-300', icon: <Clock size={14} /> },
      // Payment statuses
      pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-300', icon: <Clock size={14} /> },
      completed: { label: 'Complété', color: 'bg-green-500/20 text-green-300', icon: <CheckCircle size={14} /> },
      failed: { label: 'Échoué', color: 'bg-red-500/20 text-red-300', icon: <XCircle size={14} /> },
      refunded: { label: 'Remboursé', color: 'bg-purple-500/20 text-purple-300', icon: <XCircle size={14} /> },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-500/20 text-gray-300', icon: null };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-300 mb-2">Gestion financière</h1>
          <p className="text-gray-400">Factures, devis, paiements et rapports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-primary-500/20 pb-2">
        <TabButton
          active={activeTab === 'invoices'}
          onClick={() => setActiveTab('invoices')}
          icon={<FileText size={18} />}
          label="Factures"
          count={invoices.length}
        />
        <TabButton
          active={activeTab === 'quotes'}
          onClick={() => setActiveTab('quotes')}
          icon={<Receipt size={18} />}
          label="Devis"
          count={quotes.length}
        />
        <TabButton
          active={activeTab === 'payments'}
          onClick={() => setActiveTab('payments')}
          icon={<CreditCard size={18} />}
          label="Paiements"
          count={payments.length}
        />
        <TabButton
          active={activeTab === 'reports'}
          onClick={() => setActiveTab('reports')}
          icon={<BarChart3 size={18} />}
          label="Rapports"
        />
        <TabButton
          active={activeTab === 'charts'}
          onClick={() => setActiveTab('charts')}
          icon={<TrendingUp size={18} />}
          label="Graphiques"
        />
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setIsInvoiceFormOpen(true);
                }}
                className="glass-button text-primary-300 font-medium py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary-500/20 transition-all"
              >
                <Plus size={18} />
                Nouvelle facture
              </button>
            </div>
            <InvoiceList
              invoices={invoices}
              onEdit={(inv) => {
                setEditingInvoice(inv);
                setIsInvoiceFormOpen(true);
              }}
              onDelete={handleDeleteInvoice}
              onGeneratePDF={handleGenerateInvoicePDF}
              onAddPayment={(invoiceId) => {
                setSelectedInvoiceForPayment(invoiceId);
                setEditingPayment(null);
                setIsPaymentFormOpen(true);
              }}
              payments={payments}
              getStatusBadge={getStatusBadge}
            />
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingQuote(null);
                  setIsQuoteFormOpen(true);
                }}
                className="glass-button text-primary-300 font-medium py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary-500/20 transition-all"
              >
                <Plus size={18} />
                Nouveau devis
              </button>
            </div>
            <QuoteList
              quotes={quotes}
              onEdit={(q) => {
                setEditingQuote(q);
                setIsQuoteFormOpen(true);
              }}
              onDelete={handleDeleteQuote}
              onGeneratePDF={handleGenerateQuotePDF}
              getStatusBadge={getStatusBadge}
            />
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedInvoiceForPayment(null);
                  setEditingPayment(null);
                  setIsPaymentFormOpen(true);
                }}
                className="glass-button text-primary-300 font-medium py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-primary-500/20 transition-all"
              >
                <Plus size={18} />
                Nouveau paiement
              </button>
            </div>
            <PaymentList
              payments={payments}
              invoices={invoices}
              onEdit={(p) => {
                setEditingPayment(p);
                setSelectedInvoiceForPayment(p.invoiceId);
                setIsPaymentFormOpen(true);
              }}
              onDelete={handleDeletePayment}
              getStatusBadge={getStatusBadge}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportsView missions={missions} invoices={invoices} payments={payments} />
        )}

        {activeTab === 'charts' && (
          <FinancialCharts invoices={invoices} payments={payments} missions={missions} />
        )}
      </div>

      {/* Modals */}
      <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => {
          setIsInvoiceFormOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoice}
        initialData={editingInvoice}
        missions={missions}
      />

      <QuoteForm
        isOpen={isQuoteFormOpen}
        onClose={() => {
          setIsQuoteFormOpen(false);
          setEditingQuote(null);
        }}
        onSave={handleSaveQuote}
        initialData={editingQuote}
        missions={missions}
      />

      <PaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => {
          setIsPaymentFormOpen(false);
          setEditingPayment(null);
          setSelectedInvoiceForPayment(null);
        }}
        onSave={handleSavePayment}
        initialData={editingPayment}
        invoices={invoices}
        defaultInvoiceId={selectedInvoiceForPayment}
      />
    </div>
  );
};

// Sub-components
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
      active
        ? 'glass-button text-primary-300 glow-blue'
        : 'text-gray-400 hover:text-primary-300 hover:glass-button'
    }`}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-primary-500/30' : 'bg-gray-500/20'}`}>
        {count}
      </span>
    )}
  </button>
);

const InvoiceList: React.FC<{
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (invoice: Invoice) => void;
  onAddPayment: (invoiceId: string) => void;
  payments: Payment[];
  getStatusBadge: (status: string, type: 'invoice') => React.ReactNode;
}> = ({ invoices, onEdit, onDelete, onGeneratePDF, onAddPayment, payments, getStatusBadge }) => {
  const getPaidAmount = (invoiceId: string) => {
    return payments
      .filter(p => p.invoiceId === invoiceId && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  if (invoices.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <FileText size={48} className="mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">Aucune facture pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => {
        const paidAmount = getPaidAmount(invoice.id);
        const remaining = invoice.total - paidAmount;
        
        return (
          <div key={invoice.id} className="glass-card p-4 hover:bg-primary-500/5 transition-all">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-primary-300">{invoice.invoiceNumber}</h3>
                  {getStatusBadge(invoice.status, 'invoice')}
                </div>
                <p className="text-gray-300 font-medium mb-1">{invoice.client}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span>Émission: {format(new Date(invoice.issueDate), 'dd MMM yyyy', { locale: fr })}</span>
                  <span>Échéance: {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: fr })}</span>
                  <span className="text-primary-300 font-semibold">{invoice.total.toFixed(2)} €</span>
                </div>
                {paidAmount > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="text-green-400">Payé: {paidAmount.toFixed(2)} €</span>
                    {remaining > 0 && (
                      <span className="ml-3 text-yellow-400">Restant: {remaining.toFixed(2)} €</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onGeneratePDF(invoice)}
                  className="glass-button p-2 rounded-lg hover:bg-primary-500/20 transition-all"
                  title="Télécharger PDF"
                >
                  <Download size={18} />
                </button>
                {remaining > 0 && (
                  <button
                    onClick={() => onAddPayment(invoice.id)}
                    className="glass-button p-2 rounded-lg hover:bg-green-500/20 transition-all text-green-300"
                    title="Ajouter paiement"
                  >
                    <Euro size={18} />
                  </button>
                )}
                <button
                  onClick={() => onEdit(invoice)}
                  className="glass-button p-2 rounded-lg hover:bg-primary-500/20 transition-all"
                  title="Modifier"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => onDelete(invoice.id)}
                  className="glass-button p-2 rounded-lg hover:bg-red-500/20 transition-all text-red-300"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const QuoteList: React.FC<{
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  onGeneratePDF: (quote: Quote) => void;
  getStatusBadge: (status: string, type: 'quote') => React.ReactNode;
}> = ({ quotes, onEdit, onDelete, onGeneratePDF, getStatusBadge }) => {
  if (quotes.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Receipt size={48} className="mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">Aucun devis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => (
        <div key={quote.id} className="glass-card p-4 hover:bg-primary-500/5 transition-all">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-primary-300">{quote.quoteNumber}</h3>
                {getStatusBadge(quote.status, 'quote')}
              </div>
              <p className="text-gray-300 font-medium mb-1">{quote.client}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span>Émission: {format(new Date(quote.issueDate), 'dd MMM yyyy', { locale: fr })}</span>
                <span>Valable jusqu'au: {format(new Date(quote.validUntil), 'dd MMM yyyy', { locale: fr })}</span>
                <span className="text-primary-300 font-semibold">{quote.total.toFixed(2)} €</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onGeneratePDF(quote)}
                className="glass-button p-2 rounded-lg hover:bg-primary-500/20 transition-all"
                title="Télécharger PDF"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => onEdit(quote)}
                className="glass-button p-2 rounded-lg hover:bg-primary-500/20 transition-all"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onDelete(quote.id)}
                className="glass-button p-2 rounded-lg hover:bg-red-500/20 transition-all text-red-300"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PaymentList: React.FC<{
  payments: Payment[];
  invoices: Invoice[];
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  getStatusBadge: (status: string, type: 'payment') => React.ReactNode;
}> = ({ payments, invoices, onEdit, onDelete, getStatusBadge }) => {
  const getInvoiceNumber = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    return invoice?.invoiceNumber || 'N/A';
  };

  if (payments.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <CreditCard size={48} className="mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">Aucun paiement pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.id} className="glass-card p-4 hover:bg-primary-500/5 transition-all">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-primary-300">Facture {getInvoiceNumber(payment.invoiceId)}</h3>
                {getStatusBadge(payment.status, 'payment')}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span>Date: {format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: fr })}</span>
                <span>Méthode: {payment.method === 'bank_transfer' ? 'Virement' : payment.method === 'cash' ? 'Espèces' : payment.method === 'check' ? 'Chèque' : payment.method === 'card' ? 'Carte' : 'Autre'}</span>
                {payment.reference && <span>Réf: {payment.reference}</span>}
                <span className="text-green-300 font-semibold">{payment.amount.toFixed(2)} €</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(payment)}
                className="glass-button p-2 rounded-lg hover:bg-primary-500/20 transition-all"
                title="Modifier"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onDelete(payment.id)}
                className="glass-button p-2 rounded-lg hover:bg-red-500/20 transition-all text-red-300"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ReportsView: React.FC<{
  missions: Mission[];
  invoices: Invoice[];
  payments: Payment[];
}> = ({ missions, invoices, payments }) => {
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [period, selectedDate]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await generateFinancialReport(period, selectedDate);
      setReport(data);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'month' | 'year')}
          className="glass-button px-4 py-2 rounded-lg"
        >
          <option value="month">Mensuel</option>
          <option value="year">Annuel</option>
        </select>
        <input
          type={period === 'month' ? 'month' : 'date'}
          value={period === 'month' ? format(selectedDate, 'yyyy-MM') : format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="glass-button px-4 py-2 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenus totaux"
          value={`${report.totalRevenue.toFixed(2)} €`}
          icon={<TrendingUp size={24} />}
          color="text-green-400"
        />
        <StatCard
          title="Facturé"
          value={`${report.totalInvoiced.toFixed(2)} €`}
          icon={<FileText size={24} />}
          color="text-blue-400"
        />
        <StatCard
          title="Payé"
          value={`${report.totalPaid.toFixed(2)} €`}
          icon={<CheckCircle size={24} />}
          color="text-green-400"
        />
        <StatCard
          title="En attente"
          value={`${report.totalPending.toFixed(2)} €`}
          icon={<Clock size={24} />}
          color="text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-300">Par client</h3>
          <div className="space-y-2">
            {report.breakdown.byClient.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">{item.client}</span>
                <span className="text-primary-300 font-semibold">{item.amount.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        </div>

        {report.breakdown.byMonth && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-primary-300">Par mois</h3>
            <div className="space-y-2">
              {report.breakdown.byMonth.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">{item.month}</span>
                  <span className="text-primary-300 font-semibold">{item.amount.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="glass-card p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-400 text-sm">{title}</span>
      <div className={color}>{icon}</div>
    </div>
    <p className="text-2xl font-bold text-primary-300">{value}</p>
  </div>
);

export default FinanceView;

