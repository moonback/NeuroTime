import React, { useMemo } from 'react';
import { Invoice, Payment, Mission } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { TrendingUp, Euro, Calendar } from 'lucide-react';

interface FinancialChartsProps {
  invoices: Invoice[];
  payments: Payment[];
  missions: Mission[];
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ invoices, payments, missions }) => {
  // Données des revenus par mois (12 derniers mois)
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, 11));
    const months = eachMonthOfInterval({ start, end: now });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthKey = format(monthStart, 'yyyy-MM');
      
      // Revenus des missions terminées
      const missionRevenue = missions
        .filter(m => m.status === 'completed')
        .filter(m => {
          const missionDate = new Date(m.endTime);
          return missionDate >= monthStart && missionDate <= monthEnd;
        })
        .reduce((sum, m) => sum + m.totalEarnings, 0);
      
      // Factures émises
      const invoiced = invoices
        .filter(inv => {
          const invDate = new Date(inv.issueDate);
          return invDate >= monthStart && invDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + inv.total, 0);
      
      // Paiements reçus
      const paid = payments
        .filter(p => p.status === 'completed')
        .filter(p => {
          const payDate = new Date(p.paymentDate);
          return payDate >= monthStart && payDate <= monthEnd;
        })
        .reduce((sum, p) => sum + p.amount, 0);
      
      return {
        month: format(monthStart, 'MMM yyyy', { locale: fr }),
        monthKey,
        revenue: Math.round(missionRevenue * 100) / 100,
        invoiced: Math.round(invoiced * 100) / 100,
        paid: Math.round(paid * 100) / 100,
      };
    });
  }, [invoices, payments, missions]);

  // Répartition par client
  const clientDistribution = useMemo(() => {
    const clientMap = new Map<string, number>();
    
    invoices.forEach(inv => {
      const existing = clientMap.get(inv.client) || 0;
      clientMap.set(inv.client, existing + inv.total);
    });
    
    return Array.from(clientMap.entries())
      .map(([client, amount]) => ({ client, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 clients
  }, [invoices]);

  // Statut des factures
  const invoiceStatusDistribution = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    invoices.forEach(inv => {
      const existing = statusMap.get(inv.status) || 0;
      statusMap.set(inv.status, existing + 1);
    });
    
    return Array.from(statusMap.entries()).map(([status, count]) => {
      const labels: Record<string, string> = {
        draft: 'Brouillon',
        sent: 'Envoyée',
        paid: 'Payée',
        overdue: 'En retard',
        cancelled: 'Annulée'
      };
      return { status: labels[status] || status, count };
    });
  }, [invoices]);

  // Méthodes de paiement
  const paymentMethodDistribution = useMemo(() => {
    const methodMap = new Map<string, number>();
    
    payments
      .filter(p => p.status === 'completed')
      .forEach(p => {
        const existing = methodMap.get(p.method) || 0;
        methodMap.set(p.method, existing + p.amount);
      });
    
    return Array.from(methodMap.entries()).map(([method, amount]) => {
      const labels: Record<string, string> = {
        bank_transfer: 'Virement',
        cash: 'Espèces',
        check: 'Chèque',
        card: 'Carte',
        other: 'Autre'
      };
      return { method: labels[method] || method, amount: Math.round(amount * 100) / 100 };
    });
  }, [payments]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
  const totalInvoiced = monthlyRevenue.reduce((sum, m) => sum + m.invoiced, 0);
  const totalPaid = monthlyRevenue.reduce((sum, m) => sum + m.paid, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Revenus totaux</span>
            <TrendingUp size={24} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-primary-300">{totalRevenue.toFixed(2)} €</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Facturé</span>
            <Euro size={24} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-primary-300">{totalInvoiced.toFixed(2)} €</p>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Payé</span>
            <Calendar size={24} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-primary-300">{totalPaid.toFixed(2)} €</p>
        </div>
      </div>

      {/* Revenus par mois */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-300">Évolution des revenus (12 derniers mois)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.2} />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenus missions" />
            <Line type="monotone" dataKey="invoiced" stroke="#3b82f6" strokeWidth={2} name="Facturé" />
            <Line type="monotone" dataKey="paid" stroke="#f59e0b" strokeWidth={2} name="Payé" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par client */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-300">Top 10 clients</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.2} />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="client" type="category" width={100} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statut des factures */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-primary-300">Répartition des factures par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={invoiceStatusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {invoiceStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Méthodes de paiement */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary-300">Répartition par méthode de paiement</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={paymentMethodDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.2} />
            <XAxis dataKey="method" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialCharts;

