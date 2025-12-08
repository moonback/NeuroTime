## API / Intégrations (Supabase + Services)

L’application n’a pas de backend custom : toutes les opérations passent par Supabase JS et les services front. Les routes ci-dessous décrivent les actions côté client/Supabase.

### Authentification (Supabase Auth)
- `signUp(email, password)` → crée un utilisateur.
- `signIn(email, password)` → ouvre une session.
- `signOut()` → ferme la session.
- `getCurrentUser()` / `onAuthStateChange(cb)` → récupère/écoute la session.

### Missions (`missions` table)
- Colonnes principales : `id`, `user_id`, `title`, `client`, `location`, `description`, `start_time`, `end_time`, `status`, `rate_type`, `hourly_rate`, `total_earnings`, `details`, `logistics`, `time_slots`, `created_at`, `updated_at`.
- Opérations :
  - `loadMissionsFromSupabase()` → SELECT filtré par `user_id`.
  - `saveMissionsToSupabase(missions[])` → upsert + suppression des lignes absentes (sync complète).
  - `addMissionToSupabase(mission)` → INSERT.
  - `updateMissionInSupabase(mission)` → UPDATE par `id` + `user_id`.
  - `deleteMissionFromSupabase(id)` → DELETE par `id` + `user_id`.
- RLS : `auth.uid() = user_id` sur SELECT/INSERT/UPDATE/DELETE.

### Clients (`clients` table)
- Colonnes : `id`, `user_id`, `name`, `created_at`, `updated_at`.
- Opérations :
  - `loadClientsFromSupabase()` → SELECT par `user_id`.
  - `addClientToSupabase(name)` → INSERT + contrainte unique `(user_id, lower(name))`.
  - `syncClientsWithMissionsInSupabase(missions[])` → INSERT batch des clients manquants.
- Fallback : localStorage (`clientService`) avec dédoublonnage.

### Objectifs (`goals` table)
- Colonnes : `id`, `user_id`, `type` (`revenue|missions|hours`), `target`, `period` (`month|year`), `created_at`, `updated_at`, unique `(user_id, type, period)`.
- Opérations : `loadGoalsFromSupabase()`, `saveGoalToSupabase(goal)` (upsert + gestion contrainte unique), `saveGoalsToSupabase(goals[])`, `deleteGoalFromSupabase(id)`.

### AI (Gemini)
- `enhanceDescription(rawText, { title, location, client })` → réécrit la description (Gemini 2.5 flash).
- `generateSummary(missions[])` → synthèse courte (CA total, nombre de missions, recommandations).
- Nécessite `process.env.API_KEY` (exposé via `GEMINI_API_KEY` dans Vite).

### Stockage offline / fallback
- `storageService.saveMissions(missions)` : écrit toujours dans localStorage, puis tente Supabase.
- `storageService.loadMissions()` : lit localStorage en premier, puis tente Supabase; écrase le local si des données distantes existent.

### PWA / Service Worker
- Configuré dans `vite.config.ts` via `vite-plugin-pwa` : cache assets, Google Fonts, APIs Supabase/Nominatim en NetworkFirst. Prompt d’installation via `PWAInstallPrompt`.

