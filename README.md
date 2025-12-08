# 🧠 NeuroTime

Application web pour freelances de l’événementiel : planifiez vos missions, calculez automatiquement vos gains jour/nuit, émettez devis/factures, suivez vos paiements et objectifs, le tout avec authentification Supabase, PWA hors-ligne et assistance IA Gemini.

---

## 📋 Sommaire
- Présentation rapide
- Stack technique
- Fonctionnalités clés (MVP)
- Prérequis
- Installation & configuration
- Lancement (dev & prod)
- Structure du projet
- Variables d’environnement
- Bonnes pratiques de contribution
- Licence

---

## 🎯 Présentation
NeuroTime aide les freelances (techniciens, régisseurs, hôtes) à centraliser leurs missions, suivre leurs heures, facturer et analyser leur activité. L’app combine Supabase (auth + base Postgres), stockage local résilient et une PWA installable, avec un résumé métier généré par IA.

**Pitch (3 lignes)** : Organisez vos missions, facturez en quelques clics et suivez vos revenus réels/prévisionnels. Les tarifs jour/nuit sont calculés automatiquement, les clients sont synchronisés et vos données restent disponibles grâce au mode PWA + fallback localStorage. Une synthèse IA motive et oriente vos actions.

---

## 🛠️ Stack technique
| Couche | Technologies |
| --- | --- |
| UI | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide React, Recharts |
| Métier | date-fns (dates), calculs horaires jour/nuit, générateur PDF (jspdf) |
| Données | Supabase (PostgreSQL, Auth, RLS activé), stockage local fallback |
| AI | Google Gemini (gemini-2.5-flash) pour résumé et amélioration de descriptions |
| PWA | vite-plugin-pwa, manifest, service worker cache-first/network-first |

---

## ✨ Fonctionnalités principales (MVP)
- Missions : création/édition/suppression, statuts (planned/completed/cancelled), multi-créneaux horaires, logistique optionnelle, calcul auto jour/nuit (20€/h jour, 25€/h nuit) ou montant manuel.
- Vues : tableau de bord (KPIs, exports CSV/JSON, résumé IA), liste, calendrier mensuel, Kanban, finance.
- Finance : devis, factures, paiements, génération PDF, numéros auto, rapports financiers (mois/année), graphiques.
- Clients : carnet clients synchronisé depuis les missions, dédoublonnage, stockage Supabase + fallback local.
- Objectifs : objectifs mensuels/annuels (CA, missions, heures) synchronisés Supabase.
- Authentification : Supabase email/password, session persistante, RLS par utilisateur.
- Résilience & PWA : cache assets/API, prompt d’installation, offline partiel via localStorage, synchronisation Supabase quand disponible.

---

## 📦 Prérequis
- Node.js ≥ 18 (LTS recommandé)
- npm ≥ 9 (ou pnpm/yarn)
- Compte Supabase (URL + anon key)
- Clé API Google Gemini (AI Studio)

---

## ⚙️ Installation & configuration
1) Cloner
```bash
git clone https://github.com/votre-username/NeuroTime.git
cd NeuroTime
```
2) Installer les dépendances
```bash
npm install
```
3) Créer la base Supabase  
Dans l’éditeur SQL Supabase, exécuter dans l’ordre selon vos besoins :  
- `supabase_setup.sql` (table missions + RLS + index + trigger)  
- `supabase_migration_time_slots.sql` (multi-créneaux & logistique si base existante)  
- `supabase_migration_clients.sql` (table clients)  
- `supabase_migration_financial.sql` (tables invoices, quotes, payments)  
- `supabase_setup_goals.sql` (table goals)

4) Variables d’environnement (`.env.local`)
```env
GEMINI_API_KEY=votre_cle_gemini_ici          # exposée à Vite via define
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=cle_anon_publique
```
5) Lancer Supabase côté client : rien à installer, seules les clés suffisent (les RLS protègent les données par utilisateur).

---

## 🏃 Lancement
- Dev : `npm run dev` puis http://localhost:3000  
- Build prod : `npm run build` (artifacts dans `dist/`)  
- Preview prod : `npm run preview`

PWA : le service worker est généré au build et actif aussi en dev via vite-plugin-pwa.

---

## 📁 Structure du projet
```
NeuroTime/
├── App.tsx                    # Shell principal, navigation, lazy loading
├── components/                # UI métier (Dashboard, Calendar, Finance, Kanban…)
├── services/                  # Intégrations (auth, supabase, finance, clients, AI, PDF)
├── utils/                     # Calculs horaires, helpers de créneaux
├── types.ts                   # Modèles de données partagés
├── public/                    # Assets + manifest PWA
├── supabase_*.sql             # Scripts de création/migration
├── PWA_SETUP.md               # Notes techniques PWA
└── vite.config.ts             # Vite + plugin PWA + expose GEMINI_API_KEY
```

---

## 🔐 Variables d’environnement
| Variable | Description | Obligatoire | Exemple |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Clé Google Gemini (exposée en `process.env.API_KEY` via Vite) | Oui | `AIzaSy...` |
| `VITE_SUPABASE_URL` | URL projet Supabase | Oui | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme publique Supabase | Oui | `eyJhbGc...` |

Conseils : ne jamais commiter `.env.local`; utiliser des clés « anon », pas `service_role` côté front.

---

## 🤝 Bonnes pratiques pour contribuer
- TypeScript strict et composants fonctionnels React.
- Garder les conversions camelCase ↔ snake_case cohérentes avec Supabase (voir `supabaseService.ts`).
- Respecter le fallback offline : écrire côté services (Supabase + localStorage) plutôt que directement dans les composants.
- Rester minimal sur les dépendances (favoriser date-fns, Recharts, Supabase JS, jspdf, lucide).
- Commits clairs (`type(scope): message`, ex. `feat(finance): add PDF number generation`).
- Tests manuels : créer/éditer une mission, basculer de online à offline, créer une facture + paiement, vérifier l’auth.

---

## 📄 Licence
MIT (par défaut). Ajouter un fichier `LICENSE` si nécessaire.
