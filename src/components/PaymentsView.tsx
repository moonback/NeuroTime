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
          <h1 className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Gestion des Paiements</h1>
          <p className="text-[var(--text-tertiary)] text-xs font-medium">Réconciliation bancaire & suivi des virements</p>
        </div>

        {/* Custom Tabs */}
        <div className="glass flex p-1 rounded-full border border-[var(--border-default)] w-full md:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent'}`}
          >
            <TrendingUp size={14} /> Synthèse
          </button>
          <button
            onClick={() => setActiveTab('reconcile')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'reconcile' ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent'}`}
          >
            <Plus size={14} /> Nouveau Virement
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent'}`}
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
              icon={<CheckCircle2 className="text-[var(--success)]" />}
              color="emerald"
            />
            <StatCard
              label="En Attente"
              value={`${formatPrice(totalUnpaid, 0)} €`}
              subValue={`${unpaidMissions.length} missions`}
              icon={<Circle className="text-[var(--warning)]" />}
              color="orange"
            />
            <StatCard
              label="Total Facturé"
              value={`${formatPrice(totalCompleted, 0)} €`}
              subValue={`${completedMissions.length} missions au total`}
              icon={<Euro className="text-[var(--primary)]" />}
              color="indigo"
            />
            <StatCard
              label="Taux de Recouvrement"
              value={`${paidPercentage.toFixed(0)}%`}
              progress={paidPercentage}
              icon={<TrendingUp className="text-[var(--primary)]" />}
              color="blue"
            />
          </div>

          {/* Quick List of Unpaid */}
          <div className="glass rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-default)]">
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Info size={16} className="text-[var(--primary)]" />
                Missions en attente par client
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {clientsWithUnpaidMissions.length > 0 ? (
                clientsWithUnpaidMissions.map(client => {
                  const clientMissions = unpaidMissions.filter(m => m.client === client);
                  const clientTotal = clientMissions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
                  return (
                    <div key={client} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 border border-[var(--primary)] flex items-center justify-center text-[var(--primary)] font-bold">
                          {client.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{client}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">{clientMissions.length} mission(s) non payée(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="num-financial gradient-text text-xl font-bold">{formatPrice(clientTotal, 2)} €</p>
                        <button
                          onClick={() => { setSelectedClient(client); setActiveTab('reconcile'); }}
                          className="text-[10px] text-[var(--primary)] hover:text-[var(--primary)] font-bold flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Régler <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
                  <p className="text-[var(--text-secondary)] font-bold">Aucun paiement en attente. Félicitations !</p>
                  <button type="button" onClick={() => setActiveTab('history')} className="mt-4 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2 text-[10px] font-bold text-[var(--primary)] transition-all duration-[var(--dur-fast)] active:scale-95 hover:border-[var(--primary)]">Voir l'historique</button>
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
            <div className="glass rounded-[var(--radius-lg)] p-4 border border-[var(--border-default)]">
              <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Choisir un client</label>
              <div className="relative">
                <select
                  value={selectedClient}
                  onChange={(e) => { setSelectedClient(e.target.value); setSelectedMissionIds([]); }}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none transition-all"
                >
                  <option value="" className="bg-[var(--bg-elevated)]">Séléctionner un client...</option>
                  {clientsWithUnpaidMissions.map(c => (
                    <option key={c} value={c} className="bg-[var(--bg-elevated)]">{c}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {selectedClient && (
              <div className="glass rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-default)]">
                <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-secondary)]">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Missions de {selectedClient}</h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-[10px] bg-[var(--bg-elevated)] hover:bg-white/[0.1] px-3 py-1.5 rounded-[var(--radius-md)] font-bold text-[var(--text-secondary)] transition-all border border-[var(--border-default)]"
                  >
                    {selectedMissionIds.length === filteredUnpaidMissions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {filteredUnpaidMissions.map(mission => (
                    <div
                      key={mission.id}
                      onClick={() => handleSelectMission(mission.id)}
                      className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-[var(--bg-secondary)] ${selectedMissionIds.includes(mission.id) ? 'bg-[var(--primary)]/[0.04]' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-[var(--radius-sm)] border-2 flex items-center justify-center transition-all ${selectedMissionIds.includes(mission.id) ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border-default)] bg-white/5'}`}>
                        {selectedMissionIds.includes(mission.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{mission.title}</p>
                          <p className="num-financial text-sm font-bold text-[var(--primary)] ml-2">{formatPrice(mission.totalEarnings, 2)} €</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--text-tertiary)]">
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
              <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-dashed border-[var(--border-default)]">
                <Search className="mx-auto w-10 h-10 text-[var(--text-tertiary)] mb-4 opacity-50" />
                <p className="text-sm font-bold text-[var(--text-tertiary)]">Sélectionnez un client pour voir ses missions non payées</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Vous pourrez ensuite grouper plusieurs factures dans un seul virement</p>
              </div>
            )}
          </div>

          {/* Right Column: Virement Details */}
          <div className="space-y-4">
            <div className="glass rounded-[var(--radius-lg)] p-5 border border-[var(--primary)] bg-gradient-to-b from-[var(--primary-light)] to-transparent sticky top-4">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Euro size={16} className="text-[var(--primary)]" /> Détails du virement
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5 ml-1">Date de réception</label>
                  <input
                    type="date"
                    value={virementDetails.date}
                    onChange={(e) => setVirementDetails({ ...virementDetails, date: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all "
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5 ml-1">Montant reçu (€)</label>
                  <input
                    type="number"
                    value={virementDetails.amount || ''}
                    placeholder={selectedTotal.toString()}
                    onChange={(e) => setVirementDetails({ ...virementDetails, amount: parseFloat(e.target.value) })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all "
                  />
                  <p className="text-[9px] text-[var(--primary)]/70 mt-1.5 flex items-center gap-1 ml-1 cursor-pointer hover:text-[var(--primary)]" onClick={() => setVirementDetails({ ...virementDetails, amount: selectedTotal })}>
                    Total des missions : {selectedTotal.toFixed(2)} € (cliquer pour utiliser)
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5 ml-1">Référence / ID</label>
                  <input
                    type="text"
                    value={virementDetails.reference}
                    placeholder="Ex: TAAAY4..."
                    onChange={(e) => setVirementDetails({ ...virementDetails, reference: e.target.value })}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all "
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1.5 ml-1">Commentaire (Optionnel)</label>
                  <textarea
                    value={virementDetails.description}
                    onChange={(e) => setVirementDetails({ ...virementDetails, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all  resize-none"
                  />
                </div>

                <div className="pt-2">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-3 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Missions groupées</span>
                      <span className="num-financial text-xs font-black text-[var(--primary)]">{selectedMissionIds.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Valeur totale</span>
                      <span className="num-financial text-xs font-black text-[var(--text-primary)]">{selectedTotal.toFixed(2)} €</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveVirement}
                    disabled={selectedMissionIds.length === 0}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-30 disabled:hover:bg-[var(--primary)] text-white font-black py-4 rounded-[var(--radius-md)] shadow-xl shadow-[var(--primary-glow)] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
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
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <History size={16} className="text-[var(--primary)]" /> Historique des virements ({payments.length})
          </h2>

          {payments.length > 0 ? (
            <div className="grid gap-3">
              {payments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(payment => {
                  const isExpanded = expandedPaymentId === payment.id;
                  const paymentMissions = missions.filter(m => payment.missionIds.includes(m.id));

                  return (
                    <div key={payment.id} className="glass rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-default)] transition-all">
                      <div
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-secondary)]"
                        onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black uppercase text-[var(--text-tertiary)] leading-none">{format(new Date(payment.date), 'MMM', { locale: fr })}</span>
                            <span className="text-sm font-black text-[var(--text-primary)] leading-none">{format(new Date(payment.date), 'dd')}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                              {payment.client}
                              {payment.reference && <span className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded text-[var(--text-tertiary)] font-mono">#{payment.reference}</span>}
                            </h4>
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{payment.missionIds.length} mission(s) réconciliée(s)</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 text-right">
                          <div className="text-right">
                            <p className="num-financial gradient-text text-xl font-bold">{formatPrice(payment.amount, 2)} €</p>
                            <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">{payment.method}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePayment(payment.id); }}
                              className="p-2 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="text-[var(--text-tertiary)]">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)] animate-slide-down">
                          <div className="pt-4 divide-y divide-white/[0.02]">
                            <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3 ml-1">Missions liées à ce virement</p>
                            {paymentMissions.map(m => (
                              <div key={m.id} className="py-2.5 flex items-center justify-between text-[11px]">
                                <div className="min-w-0">
                                  <p className="font-bold text-[var(--text-secondary)] truncate">{m.title}</p>
                                  <p className="text-[9px] text-[var(--text-tertiary)]">{format(new Date(m.startTime), 'dd/MM/yyyy')} • {m.location}</p>
                                </div>
                                <span className="font-bold text-[var(--text-tertiary)]">{formatPrice(m.totalEarnings, 2)} €</span>
                              </div>
                            ))}
                            {payment.description && (
                              <div className="mt-4 pt-3 border-t border-[var(--border-default)]">
                                <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Note :</p>
                                <p className="text-xs text-[var(--text-tertiary)] italic">"{payment.description}"</p>
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
            <div className="glass rounded-[var(--radius-lg)] p-12 text-center border border-[var(--border-default)] bg-[var(--bg-secondary)]">
              <div className="mx-auto w-12 h-12 bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] flex items-center justify-center mb-4 border border-[var(--border-default)]">
                <History size={20} className="text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm font-bold text-[var(--text-tertiary)]">Aucun virement enregistré</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Vos virements bancaires groupés apparaîtront ici</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* --- Helpers Components --- */

interface PaymentStatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactElement;
  progress?: number;
  color: 'emerald' | 'orange' | 'indigo' | 'blue';
}

const StatCard: React.FC<PaymentStatCardProps> = ({ label, value, subValue, icon, progress, color }) => {
  const colors: Record<PaymentStatCardProps['color'], string> = {
    emerald: 'from-[var(--success-light)] border-[var(--success)] text-[var(--success)]',
    orange: 'from-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)]',
    indigo: 'from-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]',
    blue: 'from-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]',
  };

  return (
    <div className={`glass rounded-[var(--radius-lg)] p-4 border-t-2 bg-gradient-to-br to-transparent transition-all duration-[var(--dur-fast)] hover:border-[var(--primary)] hover:shadow-md hover:shadow-[var(--primary-glow)] ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
          {React.cloneElement(icon, { size: 18, strokeWidth: 2.5 })}
        </div>
      </div>
      <p className="gradient-text num-financial text-xl md:text-2xl font-black tracking-tight leading-none mb-1.5">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] leading-none">{label}</p>

      {subValue && <p className="text-[9px] text-[var(--text-tertiary)] font-medium mt-3 flex items-center gap-1">{subValue}</p>}

      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 bg-[var(--primary)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;
