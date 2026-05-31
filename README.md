# NeuroTime

## Pitch

NeuroTime est une application web de gestion d'activité pensée pour les freelances et indépendants.
Elle centralise les missions, horaires, clients, revenus, paiements et objectifs dans une interface PWA responsive.
L'application permet de suivre l'avancement des missions, d'estimer les revenus jour/nuit et de préparer les déclarations URSSAF.
Les données sont synchronisées avec Supabase par utilisateur, avec un cache local en secours.
Elle s'adresse aux utilisateurs qui veulent piloter leur activité sans tableur, depuis desktop ou mobile.

---

## Badges

![Build](https://img.shields.io/badge/build-manual-lightgrey)
![Licence](https://img.shields.io/badge/licence-MIT-blue)
![Version](https://img.shields.io/badge/version-0.0.0-informational)

---

## Stack technique

| Technologie | Rôle | Version détectée |
|---|---|---:|
| React | Interface utilisateur SPA | `^19.2.0` |
| React DOM | Rendu navigateur | `^19.2.0` |
| React Router DOM | Routage côté client | `^7.10.1` |
| TypeScript | Typage statique | `~5.8.2` |
| Vite | Dev server, build et preview | `^6.2.0` |
| Vite PWA / Workbox | Manifest, service worker, cache PWA | `^1.2.0` |
| Supabase JS | Auth, PostgREST, Realtime, RPC et Edge Functions | `^2.86.0` |
| PostgreSQL / Supabase | Base relationnelle, RLS, fonctions SQL | Version distante non figée |
| Tailwind CSS | Utilitaires CSS et thème | `^4.1.17` |
| date-fns | Manipulation et formatage des dates | `^4.1.0` |
| Recharts | Graphiques statistiques | `^3.5.1` |
| lucide-react | Icônes | `^0.555.0` |
| sonner | Notifications toast | `^2.0.7` |
| jsPDF + jspdf-autotable | Exports PDF | `^3.0.4` / `^5.0.7` |
| Vitest | Tests unitaires | `^4.0.15` |
| Vercel | Hébergement SPA configuré par rewrite | Configuration présente |
| Google Gemini | Amélioration IA des descriptions via Edge Function Supabase | `@google/genai ^1.30.0` |

> ⚠️ À compléter : aucune licence `LICENSE` n'est présente dans le dépôt. La section Licence applique MIT par défaut comme demandé.

---

## Fonctionnalités principales

### Pour les utilisateurs

- Authentification par e-mail et mot de passe via Supabase Auth.
- Création, édition, suppression, validation et annulation de missions.
- Gestion des clients, avec extraction des clients déjà présents dans les missions.
- Suivi des horaires, incluant des créneaux multiples par mission.
- Calcul automatique des revenus avec tarifs jour, nuit, mixte ou personnalisé.
- Statuts de mission : planifiée, terminée, annulée.
- Suivi des paiements et rattachement de virements à plusieurs missions.
- Tableau de bord avec indicateurs, prochaine mission, historique récent et missions à venir.
- Objectifs personnalisables de revenus, nombre de missions ou heures, par mois ou année.
- Statistiques et visualisations via graphiques.
- Simulateur URSSAF basé sur le chiffre d'affaires payé.
- Masquage optionnel des montants pour les démonstrations ou captures d'écran.
- Exports CSV, Markdown et PDF selon les vues disponibles.
- Application PWA installable avec service worker et raccourcis d'application.
- Fonction IA d'amélioration de description de mission via Edge Function Supabase.

### Pour les administrateurs / mainteneurs

- Schéma Supabase versionné dans `supabase/migrations` et scripts SQL complémentaires.
- Row Level Security active sur les tables métier.
- Politiques RLS par utilisateur sur missions, clients, objectifs et paiements.
- Fonction RPC transactionnelle `save_payment_with_missions` pour enregistrer un paiement et marquer les missions associées comme payées.
- Synchronisation temps réel Supabase Realtime sur missions et paiements.
- Cache `localStorage` par environnement Supabase et par utilisateur.
- Configuration PWA centralisée dans `vite.config.ts`.
- Tests Vitest existants sur les calculs métier.

---

## Prérequis

| Outil / compte | Version minimale recommandée | Pourquoi |
|---|---:|---|
| Node.js | 22.x LTS recommandé | Le projet utilise `@types/node ^22.14.0` et Vite 6. |
| npm | 10.x recommandé | Installation et exécution des scripts. |
| Compte Supabase | Projet actif | Auth, base PostgreSQL, Realtime, RPC et Edge Function IA. |
| Supabase CLI | Dernière version stable | Application des migrations et gestion Edge Functions. |
| Compte Google AI Studio / Gemini | Requis seulement pour l'IA | Clé serveur utilisée par l'Edge Function `enhance-description`. |
| Compte Vercel | Optionnel | Déploiement compatible avec `vercel.json`. |

---

## Installation

1. Cloner le dépôt.

```bash
git clone <url-du-repot>
cd NeuroTime
```

2. Installer les dépendances.

```bash
npm install
```

3. Créer un fichier d'environnement local.

```bash
cat > .env.local <<'ENV'
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
ENV
```

> ⚠️ À compléter : aucun fichier `.env.example` n'est présent dans le dépôt. Ajoutez-en un si l'onboarding doit rester standardisé.

4. Configurer Supabase.

```bash
# Depuis le dashboard Supabase, créer un projet puis appliquer les scripts SQL/migrations.
# Exemple avec la CLI si le projet est lié :
supabase db push
```

5. Lancer l'application en développement.

```bash
npm run dev
```

6. Ouvrir l'application.

```bash
open http://localhost:3000
```

---

## Configuration

| Variable | Description | Exemple | Obligatoire |
|---|---|---|---|
| `VITE_SUPABASE_URL` | URL publique du projet Supabase utilisée par le client web. Sert aussi à isoler les clés de cache local par environnement. | `https://abc123.supabase.co` | Oui |
| `VITE_SUPABASE_ANON_KEY` | Clé publique `anon` Supabase pour Auth, PostgREST, Realtime et Edge Functions côté navigateur. | `eyJhbGciOi...` | Oui |
| `GEMINI_API_KEY` | Clé Google Gemini côté serveur pour l'Edge Function `enhance-description`. Elle ne doit pas être exposée au frontend. | `AIza...` | Oui pour l'IA, non pour le cœur app |

> ⚠️ À compléter : le code frontend n'appelle plus directement Gemini. La clé `GEMINI_API_KEY` doit être configurée dans les secrets Supabase Edge Functions, mais le code de l'Edge Function n'est pas présent dans ce dépôt.

---

## Lancement

### Développement

```bash
npm run dev
```

Le serveur Vite écoute sur `0.0.0.0:3000`.

### Production locale

```bash
npm run build
npm run preview
```

### Tests

```bash
npm test
```

---

## Structure du projet

```text
NeuroTime/
├── public/                     # Icônes, logo, manifest et assets PWA
├── scripts/                    # Outils ponctuels, dont génération d'icônes
├── src/
│   ├── components/             # Vues et composants UI React
│   │   └── dashboard/          # Sous-composants du tableau de bord
│   ├── context/                # Contextes Auth et Missions/Paiements
│   ├── hooks/                  # Hooks de préférences, statistiques, exports, gestes
│   ├── services/               # Accès Supabase, Auth, stockage, clients, objectifs, IA
│   ├── utils/                  # Calculs métier, exports, validation, retry, créneaux
│   ├── App.tsx                 # Layout, navigation et routes principales
│   └── index.tsx               # Point d'entrée React
├── supabase/
│   └── migrations/             # Schéma distant Supabase versionné
├── *.sql                       # Scripts SQL complémentaires historiques
├── vite.config.ts              # Vite, PWA, chunks et alias `@`
├── vercel.json                 # Rewrite SPA pour Vercel
├── package.json                # Scripts, dépendances et version applicative
└── tsconfig.json               # Configuration TypeScript
```

---

## Contribuer

Consultez le guide de contribution : [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Licence

MIT par défaut.

> ⚠️ À compléter : ajouter un fichier `LICENSE` si la licence MIT doit être juridiquement publiée avec le projet.
