## Architecture

### Vue d’ensemble
```mermaid
flowchart TD
  UI[React + TS + Tailwind\n(PWA)] -->|Supabase JS| Auth[Supabase Auth]
  UI -->|Supabase JS| DB[(PostgreSQL Supabase)]
  UI -->|Gemini API\n(process.env.API_KEY)| AI[Google Gemini]
  UI --> Local[localStorage\nfallback offline]
  subgraph Supabase
    Auth --> DB
  end
```

- **Frontend** : React 19 + TypeScript, Vite, Tailwind 4, composants métier (Dashboard, Missions, Agenda, PWA prompt).
- **Backend-as-a-service** : Supabase (PostgreSQL + Auth). Aucune API serveur custom ; toutes les opérations passent par Supabase JS avec RLS par utilisateur.
- **Stockage** : lecture/écriture Supabase, fallback localStorage (missions, clients) pour résilience offline/PWA.
- **AI** : Gemini (gemini-2.5-flash) pour résumé métier et amélioration de description, clé exposée en build via `process.env.API_KEY` (définie à partir de `GEMINI_API_KEY` dans Vite).
- **PWA** : vite-plugin-pwa (cache First pour assets/polices, Network First pour APIs Supabase et Nominatim, prompt d’installation, manifest complet).

### Découpage applicatif
- **Entrée** : `index.tsx` monte `App` sous StrictMode.
- **Shell & navigation** : `App.tsx` gère les vues (`dashboard`, `missions`, `calendar`), l’auth Supabase, le lazy loading et le modal d’édition de mission.
- **Services** :
  - `authService.ts` : création du client Supabase, signUp/signIn/signOut, écoute d’état de session.
  - `supabaseService.ts` : CRUD missions + clients (mapping camelCase/snake_case, RLS, upsert + suppression des orphelins).
  - `storageService.ts` : orchestrateur persistance (localStorage puis Supabase).
  - `goalsService.ts` : CRUD objectifs (CA, missions, heures).
  - `clientService.ts` : synchronisation clients (Supabase + fallback local, dédoublonnage).
  - `geminiService.ts` : appels AI (amélioration description, résumé).
- **UI clés** :
  - Missions : `MissionForm`, `MissionsList`, `CalendarView` (filtre, heatmap CA).
  - Dashboard : `Dashboard` (+ Stats, Activity, Goals, Charts), export CSV/JSON, backup/restore.
  - PWA : `PWAInstallPrompt`, `SplashScreen`, `LoadingSpinner`.
- **Utilitaires** :
  - `calculations.ts` : calcul jour/nuit minute-près (20€/h, 25€/h, créneaux multiples).
  - `timeSlots.ts` : compatibilité anciens modèles + formatage créneaux.

### Flux de données (exemple mission)
1. L’utilisateur s’authentifie (Supabase Auth) → session stockée par Supabase JS.
2. Au montage d’`App`, les missions sont chargées depuis localStorage, puis synchronisées depuis Supabase (si connecté) via `storageService`.
3. Création/édition de mission dans `MissionForm` → validation → calcul auto ou montant manuel → sauvegarde locale immédiate → upsert Supabase asynchrone.
4. Dashboard/Calendar lisent le state en mémoire ; export CSV/JSON exploite le même state.

### Sécurité
- RLS activé sur toutes les tables (missions, clients, goals). Filtre par `auth.uid() = user_id` sur SELECT/INSERT/UPDATE/DELETE.
- Utiliser uniquement la clé `anon` côté front. Ne jamais exposer `service_role`.
- Données sensibles (.env) exclues du VCS.

### Performances & offline
- Lazy loading des vues lourdes (Dashboard, Calendar).
- Caching PWA (assets, polices). Network First pour les appels Supabase afin de rester cohérent tout en tolérant l’offline.
- Fallback localStorage pour missions/clients (écriture locale d’abord, synchro Supabase ensuite).

### Observabilité & erreurs
- Logs console pour échecs réseau Supabase et AI.
- Aucun système de traçage distant intégré ; ajouter Sentry/LogRocket si besoin.

