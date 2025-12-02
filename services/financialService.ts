import { getSupabase } from './authService';
import { Invoice, Quote, Payment, FinancialReport } from '../types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subMonths } from 'date-fns';
import fr from 'date-fns/locale/fr';

const getSupabaseClient = () => {
  return getSupabase();
};

// Conversion entre camelCase (TypeScript) et snake_case (PostgreSQL)
const invoiceToDb = (invoice: Invoice, userId?: string) => {
  return {
    id: invoice.id,
    user_id: userId || null,
    invoice_number: invoice.invoiceNumber,
    mission_id: invoice.missionId || null,
    client: invoice.client,
    client_address: invoice.clientAddress || null,
    client_email: invoice.clientEmail || null,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    items: invoice.items,
    subtotal: invoice.subtotal,
    tax: invoice.tax || 0,
    tax_rate: invoice.taxRate || 0,
    total: invoice.total,
    status: invoice.status,
    notes: invoice.notes || null,
  };
};

const dbToInvoice = (dbRow: any): Invoice => {
  return {
    id: dbRow.id,
    invoiceNumber: dbRow.invoice_number,
    missionId: dbRow.mission_id,
    client: dbRow.client,
    clientAddress: dbRow.client_address,
    clientEmail: dbRow.client_email,
    issueDate: dbRow.issue_date,
    dueDate: dbRow.due_date,
    items: dbRow.items,
    subtotal: parseFloat(dbRow.subtotal),
    tax: dbRow.tax ? parseFloat(dbRow.tax) : undefined,
    taxRate: dbRow.tax_rate ? parseFloat(dbRow.tax_rate) : undefined,
    total: parseFloat(dbRow.total),
    status: dbRow.status,
    notes: dbRow.notes,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
};

const quoteToDb = (quote: Quote, userId?: string) => {
  return {
    id: quote.id,
    user_id: userId || null,
    quote_number: quote.quoteNumber,
    mission_id: quote.missionId || null,
    client: quote.client,
    client_address: quote.clientAddress || null,
    client_email: quote.clientEmail || null,
    issue_date: quote.issueDate,
    valid_until: quote.validUntil,
    items: quote.items,
    subtotal: quote.subtotal,
    tax: quote.tax || 0,
    tax_rate: quote.taxRate || 0,
    total: quote.total,
    status: quote.status,
    notes: quote.notes || null,
  };
};

const dbToQuote = (dbRow: any): Quote => {
  return {
    id: dbRow.id,
    quoteNumber: dbRow.quote_number,
    missionId: dbRow.mission_id,
    client: dbRow.client,
    clientAddress: dbRow.client_address,
    clientEmail: dbRow.client_email,
    issueDate: dbRow.issue_date,
    validUntil: dbRow.valid_until,
    items: dbRow.items,
    subtotal: parseFloat(dbRow.subtotal),
    tax: dbRow.tax ? parseFloat(dbRow.tax) : undefined,
    taxRate: dbRow.tax_rate ? parseFloat(dbRow.tax_rate) : undefined,
    total: parseFloat(dbRow.total),
    status: dbRow.status,
    notes: dbRow.notes,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
};

const paymentToDb = (payment: Payment, userId?: string) => {
  return {
    id: payment.id,
    user_id: userId || null,
    invoice_id: payment.invoiceId,
    amount: payment.amount,
    payment_date: payment.paymentDate,
    method: payment.method,
    reference: payment.reference || null,
    status: payment.status,
    notes: payment.notes || null,
  };
};

const dbToPayment = (dbRow: any): Payment => {
  return {
    id: dbRow.id,
    invoiceId: dbRow.invoice_id,
    amount: parseFloat(dbRow.amount),
    paymentDate: dbRow.payment_date,
    method: dbRow.method,
    reference: dbRow.reference,
    status: dbRow.status,
    notes: dbRow.notes,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
};

// INVOICES
export const loadInvoices = async (): Promise<Invoice[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToInvoice);
  } catch (error) {
    console.error('Erreur lors du chargement des factures:', error);
    return [];
  }
};

export const saveInvoice = async (invoice: Invoice): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const dbRow = invoiceToDb(invoice, user.id);
    const { error } = await supabase
      .from('invoices')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la facture:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    throw error;
  }
};

// QUOTES
export const loadQuotes = async (): Promise<Quote[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToQuote);
  } catch (error) {
    console.error('Erreur lors du chargement des devis:', error);
    return [];
  }
};

export const saveQuote = async (quote: Quote): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const dbRow = quoteToDb(quote, user.id);
    const { error } = await supabase
      .from('quotes')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du devis:', error);
    throw error;
  }
};

export const deleteQuote = async (id: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression du devis:', error);
    throw error;
  }
};

// PAYMENTS
export const loadPayments = async (): Promise<Payment[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToPayment);
  } catch (error) {
    console.error('Erreur lors du chargement des paiements:', error);
    return [];
  }
};

export const loadPaymentsByInvoice = async (invoiceId: string): Promise<Payment[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToPayment);
  } catch (error) {
    console.error('Erreur lors du chargement des paiements:', error);
    return [];
  }
};

export const savePayment = async (payment: Payment): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const dbRow = paymentToDb(payment, user.id);
    const { error } = await supabase
      .from('payments')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du paiement:', error);
    throw error;
  }
};

export const deletePayment = async (id: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    throw error;
  }
};

// REPORTS
export const generateFinancialReport = async (
  period: 'month' | 'year',
  date: Date
): Promise<FinancialReport> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const startDate = period === 'month' 
      ? startOfMonth(date).toISOString().split('T')[0]
      : startOfYear(date).toISOString().split('T')[0];
    
    const endDate = period === 'month'
      ? endOfMonth(date).toISOString().split('T')[0]
      : endOfYear(date).toISOString().split('T')[0];

    // Charger les factures de la période
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate);

    if (invoicesError) throw invoicesError;

    // Charger les paiements de la période
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .eq('status', 'completed');

    if (paymentsError) throw paymentsError;

    // Charger les missions de la période
    const { data: missionsData, error: missionsError } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (missionsError) throw missionsError;

    const invoices = (invoicesData || []).map(dbToInvoice);
    const payments = (paymentsData || []).map(dbToPayment);
    const missions = missionsData || [];

    // Calculs
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = missions.reduce((sum, m) => sum + parseFloat(m.total_earnings || 0), 0);
    const totalPending = totalInvoiced - totalPaid;

    // Breakdown par client
    const byClientMap = new Map<string, { amount: number; count: number }>();
    invoices.forEach(inv => {
      const existing = byClientMap.get(inv.client) || { amount: 0, count: 0 };
      byClientMap.set(inv.client, {
        amount: existing.amount + inv.total,
        count: existing.count + 1
      });
    });

    const byClient = Array.from(byClientMap.entries()).map(([client, data]) => ({
      client,
      ...data
    }));

    // Breakdown par mois (si période annuelle)
    let byMonth: { month: string; amount: number; count: number }[] | undefined;
    if (period === 'year') {
      const monthMap = new Map<string, { amount: number; count: number }>();
      invoices.forEach(inv => {
        const month = format(parseISO(inv.issueDate), 'MMMM yyyy', { locale: fr });
        const existing = monthMap.get(month) || { amount: 0, count: 0 };
        monthMap.set(month, {
          amount: existing.amount + inv.total,
          count: existing.count + 1
        });
      });
      byMonth = Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        ...data
      }));
    }

    return {
      period,
      startDate,
      endDate,
      totalRevenue,
      totalInvoiced,
      totalPaid,
      totalPending,
      missionCount: missions.length,
      invoiceCount: invoices.length,
      averageInvoiceAmount: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
      breakdown: {
        byClient,
        byMonth
      }
    };
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    throw error;
  }
};

