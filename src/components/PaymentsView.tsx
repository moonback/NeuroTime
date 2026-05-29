import React, { useMemo, useState } from 'react';
import { Mission, Payment } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import {
  Euro,
  CheckCircle2,
  Circle,
  TrendingUp,
  Calendar,
  Briefcase,
  Clock,
  MapPin,
  Plus,
  History,
  ArrowRight,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Check
} from 'lucide-react';
import { formatTimeSlots } from '../utils/timeSlots';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

interface PaymentsViewProps {
  missions: Mission[];
  payments: Payment[];
  onTogglePaid: (mission: Mission) => void;
  onAddPayment: (payment: Payment) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
  hidePrices?: boolean;
}

const PaymentsView: React.FC<PaymentsViewProps> = ({
  missions,
  payments,
  onTogglePaid,
  onAddPayment,
  onDeletePayment,
  hidePrices = false
}) => {
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<'overview' | 'reconcile' | 'history'>('overview');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([]);
  const [virementDetails, setVirementDetails] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    reference: '',
    description: ''
  });
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const formatPrice = (value: number | null | undefined, decimals: number = 2): string => {
    if (hidePrices) return '***';
    if (value === null || value === undefined) return '0';
    return value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const completedMissions = useMemo(() =>
    missions.filter(m => m.status === 'completed'),
    [missions]
  );

  const unpaidMissions = useMemo(() =>
    completedMissions.filter(m => !m.isPaid),
    [completedMissions]
  );

  const clientsWithUnpaidMissions = useMemo(() => {
    const clients = new Set<string>();
    unpaidMissions.forEach(m => clients.add(m.client));
    return Array.from(clients).sort();
  }, [unpaidMissions]);

  const filteredUnpaidMissions = useMemo(() => {
    if (!selectedClient) return [];
    return unpaidMissions.filter(m => m.client === selectedClient);
  }, [unpaidMissions, selectedClient]);

  const selectedTotal = useMemo(() => {
    return filteredUnpaidMissions
      .filter(m => selectedMissionIds.includes(m.id))
      .reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
  }, [filteredUnpaidMissions, selectedMissionIds]);

  // Totals for overview
  const totalPaid = useMemo(() =>
    completedMissions.filter(m => m.isPaid).reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [completedMissions]
  );
  const totalUnpaid = useMemo(() =>
    unpaidMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0),
    [unpaidMissions]
  );
  const totalCompleted = totalPaid + totalUnpaid;
  const paidPercentage = totalCompleted > 0 ? (totalPaid / totalCompleted) * 100 : 0;

  const handleSelectMission = (id: string) => {
    setSelectedMissionIds(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedMissionIds.length === filteredUnpaidMissions.length) {
      setSelectedMissionIds([]);
    } else {
      setSelectedMissionIds(filteredUnpaidMissions.map(m => m.id));
    }
  };

  const handleSaveVirement = async () => {
    if (selectedMissionIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une mission');
      return;
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      date: virementDetails.date,
      amount: virementDetails.amount || selectedTotal,
      client: selectedClient,
      reference: virementDetails.reference,
      description: virementDetails.description,
      missionIds: selectedMissionIds,
      method: 'virement',
      createdAt: new Date().toISOString()
    };

    try {
      await onAddPayment(newPayment);
      setSelectedMissionIds([]);
      setVirementDetails({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        reference: '',
        description: ''
      });
      setActiveTab('history');
    } catch (error) {
      // Toast already handled by context
    }
  };

  const handleDeletePayment = async (id: string) => {
    const ok = await confirm({
      title: 'Supprimer ce virement ?',
      description: 'Les missions liées redeviendront "Non payées". Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger',
    });
    if (!ok) return;
    await onDeletePayment(id);
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-8 animate-fade-in">
      {confirmDialog}
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-100 tracking-tight">Gestion des Paiements</h1>
          <p className="text-gray-500 text-xs font-medium">Réconciliation bancaire & suivi des virements</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] w-full md:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <TrendingUp size={14} /> Synthèse
          </button>
          <button
            onClick={() => setActiveTab('reconcile')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'reconcile' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Plus size={14} /> Nouveau Virement
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <History size={14} /> Historique
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              label="Total Payé"
              value={`${formatPrice(totalPaid, 0)} €`}
              subValue={`${completedMissions.filter(m => m.isPaid).length} missions`}
              icon={<CheckCircle2 className="text-emerald-400" />}
              color="emerald"
            />
            <StatCard
              label="En Attente"
              value={`${formatPrice(totalUnpaid, 0)} €`}
              subValue={`${unpaidMissions.length} missions`}
              icon={<Circle className="text-orange-400" />}
              color="orange"
            />
            <StatCard
              label="Total Facturé"
              value={`${formatPrice(totalCompleted, 0)} €`}
              subValue={`${completedMissions.length} missions au total`}
              icon={<Euro className="text-indigo-400" />}
              color="indigo"
            />
            <StatCard
              label="Taux de Recouvrement"
              value={`${paidPercentage.toFixed(0)}%`}
              progress={paidPercentage}
              icon={<TrendingUp className="text-blue-400" />}
              color="blue"
            />
          </div>

          {/* Quick List of Unpaid */}
          <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Info size={16} className="text-indigo-400" />
                Missions en attente par client
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {clientsWithUnpaidMissions.length > 0 ? (
                clientsWithUnpaidMissions.map(client => {
                  const clientMissions = unpaidMissions.filter(m => m.client === client);
                  const clientTotal = clientMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
                  return (
                    <div key={client} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                          {client.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-100">{client}</p>
                          <p className="text-[10px] text-gray-500">{clientMissions.length} mission(s) non payée(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="num-financial text-sm font-bold text-orange-400">{formatPrice(clientTotal, 2)} €</p>
                        <button
                          onClick={() => { setSelectedClient(client); setActiveTab('reconcile'); }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Régler <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-500 italic text-xs">
                  Aucun paiement en attente. Félicitations !
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reconcile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Mission Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Choisir un client</label>
              <div className="relative">
                <select
                  value={selectedClient}
                  onChange={(e) => { setSelectedClient(e.target.value); setSelectedMissionIds([]); }}
                  className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-3 text-sm font-bold text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
                >
                  <option value="" className="bg-[#0b0f1a]">Séléctionner un client...</option>
                  {clientsWithUnpaidMissions.map(c => (
                    <option key={c} value={c} className="bg-[#0b0f1a]">{c}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {selectedClient && (
              <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                  <h3 className="text-sm font-bold text-gray-100">Missions de {selectedClient}</h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-[10px] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg font-bold text-gray-300 transition-all border border-white/[0.05]"
                  >
                    {selectedMissionIds.length === filteredUnpaidMissions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {filteredUnpaidMissions.map(mission => (
                    <div
                      key={mission.id}
                      onClick={() => handleSelectMission(mission.id)}
                      className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-white/[0.02] ${selectedMissionIds.includes(mission.id) ? 'bg-indigo-500/[0.04]' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedMissionIds.includes(mission.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/10 bg-white/5'}`}>
                        {selectedMissionIds.includes(mission.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-gray-100 truncate">{mission.title}</p>
                          <p className="num-financial text-sm font-bold text-indigo-400 ml-2">{formatPrice(mission.totalEarnings, 2)} €</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {format(new Date(mission.startTime), 'dd MMM yyyy', { locale: fr })}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {formatTimeSlots(mission)}</span>
                          <span className="flex items-center gap-1 truncate"><MapPin size={10} /> {mission.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selectedClient && (
              <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-white/10">
                <Search className="mx-auto w-10 h-10 text-gray-600 mb-4 opacity-50" />
                <p className="text-sm font-bold text-gray-400">Sélectionnez un client pour voir ses missions non payées</p>
                <p className="text-xs text-gray-600 mt-1">Vous pourrez ensuite grouper plusieurs factures dans un seul virement</p>
              </div>
            )}
          </div>

          {/* Right Column: Virement Details */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.03] to-transparent sticky top-4">
              <h3 className="text-sm font-extrabold text-gray-100 mb-6 flex items-center gap-2">
                <Euro size={16} className="text-indigo-400" /> Détails du virement
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Date de réception</label>
                  <input
                    type="date"
                    value={virementDetails.date}
                    onChange={(e) => setVirementDetails({ ...virementDetails, date: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-bold text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Montant reçu (€)</label>
                  <input
                    type="number"
                    value={virementDetails.amount || ''}
                    placeholder={selectedTotal.toString()}
                    onChange={(e) => setVirementDetails({ ...virementDetails, amount: parseFloat(e.target.value) })}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-bold text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                  />
                  <p className="text-[9px] text-indigo-400/70 mt-1.5 flex items-center gap-1 ml-1 cursor-pointer hover:text-indigo-400" onClick={() => setVirementDetails({ ...virementDetails, amount: selectedTotal })}>
                    Total des missions : {selectedTotal.toFixed(2)} € (cliquer pour utiliser)
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Référence / ID</label>
                  <input
                    type="text"
                    value={virementDetails.reference}
                    placeholder="Ex: TAAAY4..."
                    onChange={(e) => setVirementDetails({ ...virementDetails, reference: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-bold text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Commentaire (Optionnel)</label>
                  <textarea
                    value={virementDetails.description}
                    onChange={(e) => setVirementDetails({ ...virementDetails, description: e.target.value })}
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-bold text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner resize-none"
                  />
                </div>

                <div className="pt-2">
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Missions groupées</span>
                      <span className="num-financial text-xs font-black text-indigo-400">{selectedMissionIds.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Valeur totale</span>
                      <span className="num-financial text-xs font-black text-gray-100">{selectedTotal.toFixed(2)} €</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveVirement}
                    disabled={selectedMissionIds.length === 0}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    Confirmer le virement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2 mb-2">
            <History size={16} className="text-indigo-400" /> Historique des virements ({payments.length})
          </h2>

          {payments.length > 0 ? (
            <div className="grid gap-3">
              {[...payments]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(payment => {
                  const isExpanded = expandedPaymentId === payment.id;
                  const paymentMissions = missions.filter(m => payment.missionIds.includes(m.id));

                  return (
                    <div key={payment.id} className="glass-card rounded-2xl overflow-hidden border border-white/[0.06] transition-all">
                      <div
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01]"
                        onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black uppercase text-gray-500 leading-none">{format(new Date(payment.date), 'MMM', { locale: fr })}</span>
                            <span className="text-sm font-black text-gray-100 leading-none">{format(new Date(payment.date), 'dd')}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                              {payment.client}
                              {payment.reference && <span className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded text-gray-400 font-mono">#{payment.reference}</span>}
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{payment.missionIds.length} mission(s) réconciliée(s)</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                          <div className="text-right">
                            <p className="num-financial text-sm font-black text-emerald-400">{formatPrice(payment.amount, 2)} €</p>
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{payment.method}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePayment(payment.id); }}
                              className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="text-gray-600">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-white/[0.04] bg-white/[0.01] animate-slide-down">
                          <div className="pt-4 divide-y divide-white/[0.02]">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Missions liées à ce virement</p>
                            {paymentMissions.map(m => (
                              <div key={m.id} className="py-2.5 flex items-center justify-between text-[11px]">
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-300 truncate">{m.title}</p>
                                  <p className="text-[9px] text-gray-500">{format(new Date(m.startTime), 'dd/MM/yyyy')} • {m.location}</p>
                                </div>
                                <span className="font-bold text-gray-400">{formatPrice(m.totalEarnings, 2)} €</span>
                              </div>
                            ))}
                            {payment.description && (
                              <div className="mt-4 pt-3 border-t border-white/[0.04]">
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Note :</p>
                                <p className="text-xs text-gray-400 italic">"{payment.description}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/[0.06] bg-white/[0.01]">
              <div className="mx-auto w-12 h-12 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-4 border border-white/[0.08]">
                <History size={20} className="text-gray-600" />
              </div>
              <p className="text-sm font-bold text-gray-400">Aucun virement enregistré</p>
              <p className="text-xs text-gray-600 mt-1">Vos virements bancaires groupés apparaîtront ici</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* --- Helpers Components --- */

type StatCardColor = 'emerald' | 'orange' | 'indigo' | 'blue';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: React.ReactNode;
  icon: React.ReactElement<{ size?: number; strokeWidth?: number }>;
  progress?: number;
  color: StatCardColor;
}

const StatCard = ({ label, value, subValue, icon, progress, color }: StatCardProps) => {
  const colors: Record<StatCardColor, string> = {
    emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-400",
    orange: "from-orange-500/10 border-orange-500/20 text-orange-400",
    indigo: "from-indigo-500/10 border-indigo-500/20 text-indigo-400",
    blue: "from-blue-500/10 border-blue-500/20 text-blue-400",
  };

  return (
    <div className={`glass-card rounded-2xl p-4 border bg-gradient-to-br to-transparent ${colors[color] || colors.indigo}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]`}>
          {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
        </div>
      </div>
      <p className="num-financial text-xl md:text-2xl font-black text-gray-100 tracking-tight leading-none mb-1.5">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 leading-none">{label}</p>

      {subValue && <p className="text-[9px] text-gray-600 font-medium mt-3 flex items-center gap-1">{subValue}</p>}

      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;
