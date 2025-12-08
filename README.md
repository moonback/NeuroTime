# 🧠 NeuroTime

**Application web PWA pour freelances de l'événementiel** : gérez vos missions, calculez automatiquement vos gains jour/nuit, suivez vos objectifs et analysez votre activité avec l'assistance de l'IA Gemini.

**Pitch** : Organisez vos missions et suivez vos revenus réels/prévisionnels. Les tarifs jour/nuit sont calculés automatiquement, les clients sont synchronisés et vos données restent disponibles grâce au mode PWA + fallback localStorage. Une synthèse IA motive et oriente vos actions.

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Stack technique](#️-stack-technique)
- [Fonctionnalités principales](#-fonctionnalités-principales-mvp)
- [Prérequis](#-prérequis)
- [Installation & Configuration](#️-installation--configuration)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)
- [Variables d'environnement](#-variables-denvironnement)
- [Bonnes pratiques](#-bonnes-pratiques-pour-contribuer)
- [Documentation complémentaire](#-documentation-complémentaire)
- [Licence](#-licence)

---

## 🎯 Présentation

NeuroTime est une Progressive Web App (PWA) conçue pour les freelances de l'événementiel (techniciens, régisseurs, hôtes d'accueil). L'application centralise la gestion des missions, le suivi des heures travaillées et l'analyse de l'activité professionnelle.

### Points forts

- ✅ **Calcul automatique** des tarifs jour/nuit (20€/h jour, 25€/h nuit)
- ✅ **Multi-créneaux horaires** pour gérer les missions avec pauses
- ✅ **Synchronisation cloud** via Supabase avec fallback localStorage
- ✅ **Mode offline** grâce à la PWA et au cache intelligent
- ✅ **IA intégrée** (Gemini) pour améliorer les descriptions et générer des résumés
- ✅ **Import depuis photos** : analysez vos plannings avec Gemini Vision
- ✅ **Tableau de bord** avec graphiques, exports CSV/JSON et objectifs

---

## 🛠️ Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Styling** | Tailwind CSS 4, Lucide React (icônes) |
| **Visualisation** | Recharts (graphiques) |
| **Dates** | date-fns 4 |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) |
| **Stockage** | Supabase + localStorage (fallback offline) |
| **IA** | Google Gemini 2.5 Flash (résumé, amélioration, analyse d'images) |
| **PWA** | vite-plugin-pwa (service worker, manifest, cache) |
| **PDF** | jsPDF (génération de documents) |

### Architecture

- **Frontend uniquement** : aucune API serveur custom, tout passe par Supabase JS
- **Sécurité** : Row Level Security (RLS) activé sur toutes les tables
- **Offline-first** : écriture localStorage puis synchronisation Supabase
- **Lazy loading** : chargement à la demande des vues lourdes

---

## ✨ Fonctionnalités principales (MVP)

### 📅 Gestion des missions

- ✅ Création, édition et suppression de missions
- ✅ Statuts : `planned`, `completed`, `cancelled`
- ✅ **Multi-créneaux horaires** pour une même journée
- ✅ Calcul automatique jour/nuit (20€/h jour, 25€/h nuit) ou montant manuel
- ✅ Logistique optionnelle (heure de livraison/récupération)
- ✅ Suivi du paiement (marquer comme payé/non payé)
- ✅ **Import depuis photo** : analysez vos plannings avec Gemini Vision AI

### 📊 Vues et visualisations

- ✅ **Tableau de bord** : KPIs, graphiques de revenus, résumé IA, objectifs
- ✅ **Liste des missions** : recherche, filtres (statut, paiement), tri
- ✅ **Calendrier mensuel** : vue d'ensemble avec heatmap des revenus
- ✅ **Vue paiements** : suivi des missions payées/non payées

### 👥 Gestion des clients

- ✅ Carnet clients synchronisé automatiquement depuis les missions
- ✅ Dédoublonnage intelligent
- ✅ Stockage Supabase + fallback localStorage

### 🎯 Objectifs

- ✅ Objectifs mensuels/annuels (CA, nombre de missions, heures)
- ✅ Suivi de progression en temps réel
- ✅ Synchronisation Supabase

### 🔐 Authentification

- ✅ Supabase Auth (email/password)
- ✅ Session persistante
- ✅ RLS par utilisateur (isolation des données)

### 📱 PWA & Offline

- ✅ Installation sur mobile/desktop
- ✅ Mode offline avec cache intelligent
- ✅ Synchronisation automatique à la reconnexion
- ✅ Prompt d'installation natif

### 🤖 Intelligence artificielle

- ✅ **Résumé métier** : synthèse motivante générée par Gemini
- ✅ **Amélioration de descriptions** : réécriture professionnelle des notes
- ✅ **Analyse d'images** : extraction automatique de missions depuis photos

---

## 📦 Prérequis

- **Node.js** ≥ 18 (LTS recommandé)
- **npm** ≥ 9 (ou pnpm/yarn équivalent)
- **Compte Supabase** (gratuit) : [supabase.com](https://supabase.com)
- **Clé API Google Gemini** (gratuite) : [ai.google.dev](https://ai.google.dev)

---

## ⚙️ Installation & Configuration

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/NeuroTime.git
cd NeuroTime
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

#### 3.1. Créer un projet Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Créez un nouveau projet
3. Notez l'**URL du projet** et la **clé anonyme (anon key)**

#### 3.2. Exécuter les scripts SQL

Dans l'éditeur SQL de Supabase, exécutez les scripts dans l'ordre :

1. **`supabase_setup.sql`** : Crée la table `missions` avec RLS, index et triggers
2. **`supabase_migration_time_slots.sql`** : Ajoute le support des créneaux multiples (si base existante)
3. **`supabase_migration_clients.sql`** : Crée la table `clients`
4. **`supabase_setup_goals.sql`** : Crée la table `goals` pour les objectifs
5. **`supabase_migration_paid.sql`** : Ajoute le champ `is_paid` (si base existante)

> 💡 **Note** : Si vous partez d'une base vierge, exécutez tous les scripts. Si vous avez déjà une base, exécutez uniquement les migrations nécessaires.

### 4. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Clé API Google Gemini
# Obtenez-la sur https://ai.google.dev
GEMINI_API_KEY=votre_cle_gemini_ici

# Configuration Supabase
# Trouvez ces valeurs dans Settings > API de votre projet Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique_ici
```

> ⚠️ **Important** : Ne commitez jamais le fichier `.env.local`. Il est déjà dans `.gitignore`.

### 5. Obtenir une clé API Gemini

1. Allez sur [ai.google.dev](https://ai.google.dev)
2. Connectez-vous avec votre compte Google
3. Créez une nouvelle clé API
4. Copiez-la dans votre `.env.local`

---

## 🏃 Lancement

### Mode développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

> 💡 Le service worker PWA est actif aussi en développement via `vite-plugin-pwa`.

### Build de production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

### Preview de production

```bash
npm run preview
```

Permet de tester le build de production localement avant déploiement.

---

## 📁 Structure du projet

```
NeuroTime/
├── App.tsx                      # Shell principal, navigation, lazy loading
├── index.tsx                    # Point d'entrée React
├── index.html                   # Template HTML
├── index.css                    # Styles globaux Tailwind
│
├── components/                  # Composants UI
│   ├── AuthModal.tsx            # Modal d'authentification
│   ├── Dashboard.tsx            # Vue tableau de bord
│   ├── DashboardStats.tsx      # Statistiques du dashboard
│   ├── DashboardCharts.tsx     # Graphiques (Recharts)
│   ├── DashboardGoals.tsx      # Gestion des objectifs
│   ├── DashboardActivity.tsx   # Activité récente
│   ├── MissionsList.tsx         # Liste des missions
│   ├── MissionForm.tsx          # Formulaire création/édition
│   ├── CalendarView.tsx         # Vue calendrier mensuel
│   ├── PaymentsView.tsx         # Vue paiements
│   ├── ImageUploadMission.tsx   # Import depuis photo (Gemini Vision)
│   ├── PWAInstallPrompt.tsx    # Prompt d'installation PWA
│   ├── SplashScreen.tsx         # Écran de démarrage
│   ├── LoadingSpinner.tsx       # Indicateur de chargement
│   └── Tooltip.tsx              # Tooltip réutilisable
│
├── services/                    # Services métier
│   ├── authService.ts           # Authentification Supabase
│   ├── supabaseService.ts       # CRUD missions + clients
│   ├── storageService.ts        # Orchestrateur persistance (Supabase + localStorage)
│   ├── goalsService.ts          # Gestion des objectifs
│   ├── clientService.ts          # Synchronisation clients
│   └── geminiService.ts         # Intégration Gemini AI
│
├── utils/                       # Utilitaires
│   ├── calculations.ts          # Calculs horaires jour/nuit
│   └── timeSlots.ts             # Helpers pour créneaux multiples
│
├── types.ts                     # Types TypeScript partagés
│
├── public/                      # Assets statiques
│   ├── manifest.json            # Manifest PWA
│   ├── icon-*.png               # Icônes PWA
│   ├── logo.png                 # Logo de l'application
│   └── ...
│
├── supabase_*.sql               # Scripts SQL Supabase
│   ├── supabase_setup.sql       # Setup initial
│   ├── supabase_migration_*.sql # Migrations
│   └── supabase_setup_goals.sql # Setup objectifs
│
├── vite.config.ts               # Configuration Vite + PWA
├── tailwind.config.js            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
├── package.json                  # Dépendances
│
└── Documentation/
    ├── README.md                 # Ce fichier
    ├── ROADMAP.md                # Roadmap du projet
    ├── ARCHITECTURE.md           # Architecture détaillée
    ├── DB_SCHEMA.md              # Schéma de base de données
    ├── CONTRIBUTING.md           # Guide de contribution
    ├── API_DOCS.md               # Documentation API
    ├── SUPABASE_SETUP.md         # Guide Supabase
    └── PWA_SETUP.md              # Notes techniques PWA
```

---

## 🔐 Variables d'environnement

| Variable | Description | Obligatoire | Où l'obtenir |
|----------|-------------|-------------|--------------|
| `GEMINI_API_KEY` | Clé API Google Gemini pour l'IA | ✅ Oui | [ai.google.dev](https://ai.google.dev) |
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | ✅ Oui | Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme publique Supabase | ✅ Oui | Settings > API > anon public |

> ⚠️ **Sécurité** : 
> - Ne commitez jamais `.env.local`
> - Utilisez uniquement la clé `anon` (publique), jamais `service_role` côté frontend
> - Les politiques RLS protègent vos données par utilisateur

---

## 🤝 Bonnes pratiques pour contribuer

### Style de code

- **TypeScript strict** : typage complet, pas de `any` sauf cas exceptionnels
- **Composants fonctionnels** : hooks React (`useState`, `useEffect`, `useMemo`, `useCallback`)
- **Styling** : Tailwind CSS utilitaire, réutiliser les classes `glass-*` et `glow-*` existantes
- **Logique métier** : dans `services/`, pas dans les composants

### Conventions

- **Nommage** : camelCase pour JS/TS, PascalCase pour composants, snake_case en base Supabase
- **Commits** : `type(scope): message` (ex. `feat(auth): improve session handling`)
- **Branches** : `feature/<sujet>` ou `fix/<sujet>`

### Architecture

- **Conversions camelCase ↔ snake_case** : centralisées dans `supabaseService.ts`
- **Fallback offline** : toujours écrire localStorage puis Supabase (via `storageService.ts`)
- **RLS** : toutes les requêtes sont automatiquement filtrées par `user_id`

### Tests manuels

Avant d'ouvrir une PR, testez au minimum :

1. ✅ Authentification (connexion/déconnexion)
2. ✅ Création/édition d'une mission avec multi-créneaux
3. ✅ Calcul automatique jour/nuit
4. ✅ Export CSV/JSON depuis le dashboard
5. ✅ Mode offline (désactiver réseau) puis reconnexion
6. ✅ Prompt PWA (installation sur mobile/desktop)
7. ✅ Import depuis photo (analyse Gemini Vision)

### Ouverture d'une Pull Request

- Décrire le problème et la solution
- Mentionner les migrations SQL si nécessaire
- Joindre des captures d'écran si l'UI change
- Vérifier que le build passe (`npm run build`)

> 📖 Pour plus de détails, consultez [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📚 Documentation complémentaire

- **[ROADMAP.md](./ROADMAP.md)** : Évolution du projet (MVP → V1 → V2)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** : Architecture détaillée et diagrammes
- **[DB_SCHEMA.md](./DB_SCHEMA.md)** : Schéma de base de données complet
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** : Guide de contribution détaillé
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** : Guide de configuration Supabase
- **[PWA_SETUP.md](./PWA_SETUP.md)** : Notes techniques sur la PWA
- **[API_DOCS.md](./API_DOCS.md)** : Documentation des services

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

---

## 🙏 Remerciements

- [Supabase](https://supabase.com) pour l'infrastructure backend
- [Google Gemini](https://ai.google.dev) pour l'IA
- [Vite](https://vitejs.dev) pour le build tool
- [Tailwind CSS](https://tailwindcss.com) pour le styling
- [React](https://react.dev) pour le framework UI

---

**Fait avec ❤️ pour les freelances de l'événementiel**
