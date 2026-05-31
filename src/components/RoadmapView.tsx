import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Filter,
  Gauge,
  GitBranch,
  Layers3,
  LockKeyhole,
  Map,
  PackageCheck,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

type RoadmapDomain = 'product' | 'technical' | 'security';
type RoadmapStatus = 'done' | 'in-progress' | 'next' | 'planned';
type RoadmapPhaseId = 'foundation' | 'hardening' | 'growth' | 'intelligence';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  domain: RoadmapDomain;
  status: RoadmapStatus;
  impact: 'Critical' | 'High' | 'Medium';
  effort: 'S' | 'M' | 'L';
  outcomes: string[];
}

interface RoadmapPhase {
  id: RoadmapPhaseId;
  label: string;
  timeframe: string;
  headline: string;
  summary: string;
  accent: string;
  icon: React.ElementType;
  items: RoadmapItem[];
}

const domainMeta: Record<RoadmapDomain, { label: string; icon: React.ElementType; className: string }> = {
  product: {
    label: 'Produit',
    icon: Sparkles,
    className: 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]/30',
  },
  technical: {
    label: 'Technique',
    icon: Wrench,
    className: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/30',
  },
  security: {
    label: 'Sécurité',
    icon: ShieldCheck,
    className: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30',
  },
};

const statusMeta: Record<RoadmapStatus, { label: string; icon: React.ElementType; className: string }> = {
  done: {
    label: 'Livré',
    icon: CheckCircle2,
    className: 'bg-[var(--success-light)] text-[var(--success)] border-[var(--success)]/30',
  },
  'in-progress': {
    label: 'En cours',
    icon: Clock3,
    className: 'bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/30',
  },
  next: {
    label: 'Prochain',
    icon: CircleDot,
    className: 'bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]/30',
  },
  planned: {
    label: 'Planifié',
    icon: GitBranch,
    className: 'bg-white/[0.04] text-[var(--text-secondary)] border-[var(--border-default)]',
  },
};

const phases: RoadmapPhase[] = [
  {
    id: 'foundation',
    label: 'Phase 1',
    timeframe: 'Maintenant',
    headline: 'Fondations métier & fiabilité PWA',
    summary: 'Stabiliser le cœur de gestion des missions, des paiements et des préférences pour rendre l’expérience quotidienne irréprochable.',
    accent: 'from-[var(--primary)] to-[#7c3aed]',
    icon: Layers3,
    items: [
      {
        id: 'mission-lifecycle',
        title: 'Cycle complet des missions',
        description: 'Création, modification, validation, statut terminé et verrouillage des missions payées avec confirmations destructives.',
        domain: 'product',
        status: 'done',
        impact: 'Critical',
        effort: 'L',
        outcomes: ['Moins d’erreurs opérationnelles', 'Flux de travail clair de la planification au paiement', 'Protection des données facturées'],
      },
      {
        id: 'offline-persistence',
        title: 'Persistance locale robuste',
        description: 'Préférences, données métier et indicateurs restent disponibles dans une expérience PWA fluide.',
        domain: 'technical',
        status: 'done',
        impact: 'High',
        effort: 'M',
        outcomes: ['Application utilisable sur site', 'Chargements perçus plus rapides', 'Réduction du risque de perte de contexte'],
      },
      {
        id: 'pricing-privacy',
        title: 'Mode confidentialité des tarifs',
        description: 'Masquage instantané des montants dans les vues sensibles pour travailler en public ou devant un client.',
        domain: 'security',
        status: 'done',
        impact: 'High',
        effort: 'S',
        outcomes: ['Confidentialité commerciale', 'Contrôle utilisateur immédiat', 'Cohérence desktop et mobile'],
      },
    ],
  },
  {
    id: 'hardening',
    label: 'Phase 2',
    timeframe: 'Priorité haute',
    headline: 'Sécurité, qualité et observabilité',
    summary: 'Renforcer le socle Supabase, les exports et la validation afin de préparer NeuroTime à un usage premium à grande échelle.',
    accent: 'from-emerald-400 to-cyan-400',
    icon: LockKeyhole,
    items: [
      {
        id: 'supabase-rls',
        title: 'Audit Supabase RLS & isolation des comptes',
        description: 'Revue des policies Row Level Security, des règles d’accès et des chemins d’écriture pour garantir une séparation stricte des utilisateurs.',
        domain: 'security',
        status: 'in-progress',
        impact: 'Critical',
        effort: 'M',
        outcomes: ['Isolation multi-compte vérifiée', 'Réduction du risque de fuite de données', 'Documentation des policies critiques'],
      },
      {
        id: 'validation-contracts',
        title: 'Contrats de validation mission/paiement',
        description: 'Centraliser les règles métier et couvrir les cas limites de dates, nuit, paiement partiel et missions verrouillées.',
        domain: 'technical',
        status: 'next',
        impact: 'Critical',
        effort: 'M',
        outcomes: ['Moins de divergences UI/service', 'Tests unitaires plus représentatifs', 'Erreurs utilisateur mieux expliquées'],
      },
      {
        id: 'export-hardening',
        title: 'Exports premium PDF/CSV',
        description: 'Fiabiliser la génération, les libellés, les totaux et le rendu mobile des exports pour l’administratif freelance.',
        domain: 'product',
        status: 'next',
        impact: 'High',
        effort: 'M',
        outcomes: ['Documents partageables', 'Contrôle avant déclaration', 'Gain de temps administratif'],
      },
      {
        id: 'error-telemetry',
        title: 'Observabilité front-end',
        description: 'Mettre en place un suivi des erreurs applicatives, des échecs de synchronisation et des métriques de performance PWA.',
        domain: 'technical',
        status: 'planned',
        impact: 'High',
        effort: 'M',
        outcomes: ['Diagnostic plus rapide', 'Priorisation basée sur les incidents réels', 'Suivi des régressions de performance'],
      },
    ],
  },
  {
    id: 'growth',
    label: 'Phase 3',
    timeframe: 'Croissance',
    headline: 'Productivité freelance & pilotage financier',
    summary: 'Transformer les données de missions en décisions concrètes pour mieux facturer, relancer et anticiper les périodes fortes.',
    accent: 'from-amber-300 to-orange-500',
    icon: Gauge,
    items: [
      {
        id: 'cashflow-forecast',
        title: 'Prévision de trésorerie',
        description: 'Projection des revenus attendus, payés, en retard et à déclarer avec alertes visuelles par période.',
        domain: 'product',
        status: 'planned',
        impact: 'Critical',
        effort: 'L',
        outcomes: ['Vision claire du cash à venir', 'Meilleure anticipation URSSAF', 'Décisions de disponibilité plus rapides'],
      },
      {
        id: 'client-crm',
        title: 'Mini CRM clients & lieux',
        description: 'Historique client, tarifs habituels, notes terrain et suggestions au moment de créer une mission.',
        domain: 'product',
        status: 'planned',
        impact: 'High',
        effort: 'L',
        outcomes: ['Saisie accélérée', 'Relation client mieux suivie', 'Tarification plus cohérente'],
      },
      {
        id: 'reminders',
        title: 'Relances et rappels intelligents',
        description: 'Notifications PWA pour missions à valider, paiements en attente, échéances URSSAF et exports mensuels.',
        domain: 'technical',
        status: 'planned',
        impact: 'High',
        effort: 'M',
        outcomes: ['Moins d’oublis', 'Meilleure discipline administrative', 'Engagement produit récurrent'],
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Phase 4',
    timeframe: 'Différenciation',
    headline: 'Assistant IA et automatisations premium',
    summary: 'Utiliser Gemini avec garde-fous pour accélérer la saisie, détecter les anomalies et proposer des optimisations concrètes.',
    accent: 'from-fuchsia-400 to-[var(--primary)]',
    icon: Rocket,
    items: [
      {
        id: 'gemini-copilot',
        title: 'Copilote Gemini pour missions',
        description: 'Création assistée depuis un brief, résumé de planning et suggestions de champs manquants avec validation explicite.',
        domain: 'product',
        status: 'planned',
        impact: 'High',
        effort: 'L',
        outcomes: ['Saisie plus rapide', 'Moins de champs oubliés', 'Expérience premium différenciante'],
      },
      {
        id: 'ai-guardrails',
        title: 'Garde-fous IA & données sensibles',
        description: 'Limiter les données envoyées au modèle, tracer les actions proposées et garder l’utilisateur décisionnaire.',
        domain: 'security',
        status: 'planned',
        impact: 'Critical',
        effort: 'M',
        outcomes: ['Confidentialité des clients', 'Transparence des traitements IA', 'Réduction des hallucinations actionnables'],
      },
      {
        id: 'anomaly-detection',
        title: 'Détection d’anomalies métier',
        description: 'Repérer les doublons, tarifs inhabituels, écarts de durée et paiements incohérents avant export ou déclaration.',
        domain: 'technical',
        status: 'planned',
        impact: 'High',
        effort: 'L',
        outcomes: ['Qualité des données accrue', 'Moins d’erreurs déclaratives', 'Confiance avant facturation'],
      },
    ],
  },
];

const allDomains = Object.keys(domainMeta) as RoadmapDomain[];
const allStatuses = Object.keys(statusMeta) as RoadmapStatus[];

const RoadmapView: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<RoadmapPhaseId | 'all'>('all');
  const [selectedDomains, setSelectedDomains] = useState<RoadmapDomain[]>(allDomains);
  const [selectedStatus, setSelectedStatus] = useState<RoadmapStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>(['supabase-rls']);

  const roadmapItems = useMemo(
    () => phases.flatMap((phase) => phase.items.map((item) => ({ ...item, phaseId: phase.id, phaseHeadline: phase.headline }))),
    [],
  );

  const filteredPhases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return phases
      .filter((phase) => selectedPhase === 'all' || phase.id === selectedPhase)
      .map((phase) => ({
        ...phase,
        items: phase.items.filter((item) => {
          const matchesDomain = selectedDomains.includes(item.domain);
          const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
          const matchesQuery = !normalizedQuery || [item.title, item.description, item.domain, phase.headline, ...item.outcomes]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);

          return matchesDomain && matchesStatus && matchesQuery;
        }),
      }))
      .filter((phase) => phase.items.length > 0);
  }, [query, selectedDomains, selectedPhase, selectedStatus]);

  const completionRate = Math.round((roadmapItems.filter((item) => item.status === 'done').length / roadmapItems.length) * 100);
  const criticalCount = roadmapItems.filter((item) => item.impact === 'Critical' && item.status !== 'done').length;
  const visibleCount = filteredPhases.reduce((total, phase) => total + phase.items.length, 0);

  const toggleDomain = (domain: RoadmapDomain) => {
    setSelectedDomains((current) => {
      if (current.includes(domain)) {
        return current.length === 1 ? current : current.filter((value) => value !== domain);
      }

      return [...current, domain];
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const clearFilters = () => {
    setSelectedPhase('all');
    setSelectedDomains(allDomains);
    setSelectedStatus('all');
    setQuery('');
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] glass-elevated p-5 md:p-8">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,rgba(var(--rgb-primary),0.28),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.16),transparent_34%)]" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-default)] bg-white/[0.04] text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              <Map size={13} className="text-[var(--primary)]" />
              NeuroTime Roadmap
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-display font-semibold tracking-[-0.04em] text-[var(--text-primary)] leading-[0.98]">
                Plan produit, technique et sécurité
              </h1>
              <p className="mt-4 text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                Une vue priorisée des chantiers qui rendent NeuroTime plus fiable, plus sûr et plus utile pour les freelances de l’événementiel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {allDomains.map((domain) => {
                const meta = domainMeta[domain];
                const Icon = meta.icon;
                const isActive = selectedDomains.includes(domain);

                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => toggleDomain(domain)}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border text-xs font-semibold transition-all ${isActive ? meta.className : 'bg-white/[0.03] text-[var(--text-tertiary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'}`}
                  >
                    <Icon size={14} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <MetricCard label="Avancement" value={`${completionRate}%`} icon={Target} tone="primary" />
            <MetricCard label="Chantiers" value={roadmapItems.length.toString()} icon={PackageCheck} tone="neutral" />
            <MetricCard label="Critiques" value={criticalCount.toString()} icon={AlertTriangle} tone="warning" />
          </div>
        </div>
      </section>

      <section className="glass rounded-[var(--radius-xl)] p-3 md:p-4 space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un chantier, une issue sécurité, un bénéfice…"
              className="glass-input w-full rounded-[var(--radius-lg)] pl-10 pr-10 py-3 text-sm"
              type="search"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </label>

          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
            <Filter size={15} className="shrink-0 text-[var(--text-tertiary)]" />
            <SegmentButton active={selectedStatus === 'all'} onClick={() => setSelectedStatus('all')}>Tous</SegmentButton>
            {allStatuses.map((status) => (
              <SegmentButton key={status} active={selectedStatus === status} onClick={() => setSelectedStatus(status)}>
                {statusMeta[status].label}
              </SegmentButton>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          <PhaseButton active={selectedPhase === 'all'} onClick={() => setSelectedPhase('all')} label="Toutes les phases" count={roadmapItems.length} />
          {phases.map((phase) => (
            <PhaseButton key={phase.id} active={selectedPhase === phase.id} onClick={() => setSelectedPhase(phase.id)} label={phase.label} count={phase.items.length} />
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
        <span>{visibleCount} chantier{visibleCount > 1 ? 's' : ''} affiché{visibleCount > 1 ? 's' : ''}</span>
        {(query || selectedPhase !== 'all' || selectedStatus !== 'all' || selectedDomains.length !== allDomains.length) && (
          <button type="button" onClick={clearFilters} className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)]">
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {filteredPhases.length > 0 ? (
        <div className="space-y-5">
          {filteredPhases.map((phase, phaseIndex) => {
            const PhaseIcon = phase.icon;

            return (
              <section key={phase.id} className="relative grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="lg:sticky lg:top-6 h-fit glass-card rounded-[var(--radius-xl)] p-4 overflow-hidden">
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${phase.accent}`} />
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-[var(--radius-lg)] bg-gradient-to-br ${phase.accent} flex items-center justify-center text-white shadow-lg shadow-black/20`}>
                      <PhaseIcon size={21} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{phase.label} · {phase.timeframe}</p>
                      <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)] leading-tight">{phase.headline}</h2>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-[var(--text-secondary)]">{phase.summary}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                    <Zap size={12} /> Priorité {phaseIndex + 1}
                  </div>
                </div>

                <div className="space-y-3">
                  {phase.items.map((item) => (
                    <RoadmapCard
                      key={item.id}
                      item={item}
                      expanded={expandedItems.includes(item.id)}
                      onToggle={() => toggleExpanded(item.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-[var(--radius-xl)] p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-[var(--radius-lg)] bg-white/[0.04] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-tertiary)]">
            <Search size={22} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Aucun chantier trouvé</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Essayez une autre recherche ou réinitialisez les filtres.</p>
          <button type="button" onClick={clearFilters} className="mt-4 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold text-sm">
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: 'primary' | 'neutral' | 'warning' }) => {
  const toneClass = tone === 'primary'
    ? 'text-[var(--primary)] bg-[var(--primary-light)]'
    : tone === 'warning'
      ? 'text-[var(--warning)] bg-[var(--warning-light)]'
      : 'text-[var(--text-secondary)] bg-white/[0.04]';

  return (
    <div className="glass-card rounded-[var(--radius-lg)] p-3 min-w-0">
      <div className={`w-8 h-8 rounded-[var(--radius-md)] ${toneClass} flex items-center justify-center mb-3`}>
        <Icon size={16} />
      </div>
      <div className="text-2xl font-semibold num-financial leading-none text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold truncate">{label}</div>
    </div>
  );
};

const SegmentButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold border transition-all ${active ? 'bg-[var(--primary-light)] border-[var(--primary)]/40 text-[var(--primary)]' : 'bg-white/[0.03] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'}`}
  >
    {children}
  </button>
);

const PhaseButton = ({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border text-xs font-semibold transition-all ${active ? 'bg-[var(--bg-elevated)] border-[var(--primary)]/50 text-[var(--text-primary)]' : 'bg-white/[0.02] border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
  >
    {label}
    <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px] num-financial">{count}</span>
  </button>
);

const RoadmapCard = ({ item, expanded, onToggle }: { item: RoadmapItem; expanded: boolean; onToggle: () => void }) => {
  const DomainIcon = domainMeta[item.domain].icon;
  const StatusIcon = statusMeta[item.status].icon;

  return (
    <article className="glass-card rounded-[var(--radius-xl)] overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full p-4 md:p-5 text-left">
        <div className="flex gap-4 items-start">
          <div className={`shrink-0 w-10 h-10 rounded-[var(--radius-lg)] border flex items-center justify-center ${domainMeta[item.domain].className}`}>
            <DomainIcon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusMeta[item.status].className}`}>
                <StatusIcon size={11} />
                {statusMeta[item.status].label}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.03] border border-[var(--border-subtle)] text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">
                Impact {item.impact}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.03] border border-[var(--border-subtle)] text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">
                Effort {item.effort}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] leading-tight">{item.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
          </div>
          <ChevronDown size={18} className={`shrink-0 mt-1 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 animate-fade-up">
          <div className="ml-0 md:ml-14 pt-4 border-t border-[var(--border-subtle)]">
            <div className="grid gap-3 md:grid-cols-3">
              {item.outcomes.map((outcome) => (
                <div key={outcome} className="p-3 rounded-[var(--radius-lg)] bg-white/[0.03] border border-[var(--border-subtle)]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 text-[var(--success)] shrink-0" />
                    <span className="text-xs leading-relaxed text-[var(--text-secondary)]">{outcome}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
              <span className="inline-flex items-center gap-1.5"><Users size={13} /> Freelances événementiel</span>
              <span className="inline-flex items-center gap-1.5"><ArrowUpRight size={13} /> Valeur premium mesurable</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default RoadmapView;
