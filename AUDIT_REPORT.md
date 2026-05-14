# Audit technique senior SaaS — NeuroTime

Date de l'audit : 2026-05-14  
Périmètre audité : React 19, TypeScript, Supabase, PostgreSQL/RLS, PWA/offline, calculs dates/revenus, sécurité, performance.

## Synthèse exécutive

L'incohérence multi-device observée est principalement causée par une architecture de persistance **localStorage-first + snapshots complets réécrits dans Supabase**, sans journal de mutations, sans versionnement fiable, sans realtime, sans stratégie offline explicite et avec un service worker qui met en cache les appels Supabase pendant une heure. Ce design transforme chaque navigateur en source de vérité concurrente. Au refresh, au retour online ou à la reconnexion, un appareil peut réinjecter son cache local dans Supabase et supprimer/écraser des données créées ailleurs.

Le risque production le plus important n'est pas un bug isolé : c'est la combinaison de :

1. `localStorage` non scopé par `user_id` ;
2. sauvegarde de toute la liste des missions avec suppression différentielle ;
3. résolution de conflits basée sur `updatedAt` absent côté local ;
4. absence de subscriptions realtime ;
5. cache PWA `NetworkFirst` appliqué à `*.supabase.co` ;
6. SQL de lecture publique des missions terminées ;
7. migrations incomplètes pour `payments` / `payment_id`.

---

## 1. Cause racine probable — top 5

### 1. Snapshots complets de missions qui suppriment les lignes absentes — probabilité très élevée

`saveMissionsToSupabase` récupère tous les IDs existants de l'utilisateur, calcule les IDs absents de la liste locale, puis supprime ces IDs avant de faire un `upsert`. Si un device possède une liste locale ancienne, il peut supprimer des missions créées sur un autre device.

Code problématique :

```ts
const existingIds = new Set((existingData || []).map(row => row.id));
const missionIds = new Set(missions.map(m => m.id));
const idsToDelete = Array.from(existingIds).filter(id => !missionIds.has(id));
await supabase.from('missions').delete().in('id', idsToDelete).eq('user_id', userId);
await supabase.from('missions').upsert(missionsDbFiltered, { onConflict: 'id' });
```

Fichiers concernés : `src/services/supabaseService.ts`, `src/services/storageService.ts`, `src/context/MissionContext.tsx`.

### 2. `localStorage` partagé par navigateur, non lié à l'utilisateur — probabilité très élevée

Les clés `NeuroTime_missions_v1`, `NeuroTime_payments_v1`, `neurotime_clients_v1` et `neurotime_preferences_v1` ne contiennent ni `user.id`, ni tenant, ni environnement. Après logout/login ou changement de compte dans le même navigateur, les données locales peuvent être mélangées puis resynchronisées.

Code problématique :

```ts
const STORAGE_KEY = 'NeuroTime_missions_v1';
const PAYMENTS_KEY = 'NeuroTime_payments_v1';
localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
```

Fichiers concernés : `src/services/storageService.ts`, `src/services/clientService.ts`, `src/services/preferencesService.ts`.

### 3. Cache PWA des APIs Supabase — probabilité élevée

La config Workbox met en cache toutes les URLs `https://*.supabase.co/*` avec `NetworkFirst` et TTL d'une heure. En cas de timeout réseau ou de retour online instable, les réponses REST Supabase peuvent être servies depuis un cache stale, ce qui contredit la promesse de cohérence multi-device.

Code problématique :

```ts
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'supabase-cache',
    expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
    networkTimeoutSeconds: 10
  }
}
```

Fichier concerné : `vite.config.ts`.

### 4. Absence de realtime et de mécanisme de convergence — probabilité élevée

Aucune subscription `postgres_changes` n'est présente dans `src/`. Les modifications faites sur un appareil ne sont pas poussées vers les autres sessions ouvertes ; elles ne convergent qu'au prochain reload/fetch, puis peuvent être écrasées par la logique snapshot.

### 5. Conflits résolus avec `updatedAt` local absent / non mis à jour — probabilité élevée

Le type `Mission` possède `updatedAt`, mais les créations/modifications locales ne l'assignent pas. La résolution de conflit retombe alors sur `startTime`, qui est une date métier, pas une horloge de modification. Une mission ancienne modifiée aujourd'hui peut perdre face à une version Supabase dont `updated_at` est plus récente, ou inversement selon les fuseaux et anciennes données.

Code problématique :

```ts
const localUpdatedAt = localMission.updatedAt || localMission.startTime;
const supabaseUpdatedAt = supabaseMission.updatedAt || supabaseMission.startTime;
if (new Date(localUpdatedAt) > new Date(supabaseUpdatedAt)) {
  missionMap.set(localMission.id, localMission);
}
```

Fichiers concernés : `src/services/storageService.ts`, `src/components/MissionForm.tsx`, `src/types.ts`.

---

## 2. Problèmes détaillés et corrections précises

### P1 — Sauvegarde destructive par snapshot complet

**Gravité : critique**

#### Description

Chaque changement de mission déclenche une sauvegarde différée de la liste complète. Cette sauvegarde supprime de Supabase toutes les missions absentes du tableau React courant.

#### Cause technique

`MissionContext` modifie seulement l'état local, puis un `useEffect` observe `missions` et appelle `saveMissions(missions)` après 500 ms. `saveMissions` écrit d'abord dans `localStorage`, puis appelle `saveMissionsToSupabase`. Ce dernier fait un diff entre la liste locale et la base distante, puis supprime les IDs distants absents.

#### Impact

- Mission créée sur desktop puis supprimée par mobile au prochain autosave si le mobile n'avait pas encore la mission.
- Revenus/statistiques différentes selon l'ordre des refreshs.
- Données qui disparaissent puis reviennent si un autre cache local réécrit ensuite la base.
- Perte de données silencieuse en production.

#### Code problématique

```ts
const idsToDelete = Array.from(existingIds).filter(id => !missionIds.has(id));
if (idsToDelete.length > 0) {
  await supabase.from('missions').delete().in('id', idsToDelete).eq('user_id', userId);
}
await supabase.from('missions').upsert(missionsDbFiltered, { onConflict: 'id' });
```

#### Correction précise

Remplacer le modèle snapshot par des mutations unitaires :

- `addMission` doit appeler `insert/upsert` d'une seule mission ;
- `updateMission` doit appeler `update` d'une seule mission avec contrôle de version ;
- `deleteMission` doit faire un soft delete ou un delete explicite ;
- l'import massif doit être une opération dédiée et confirmée, idéalement transactionnelle côté RPC ;
- ne jamais déduire une suppression de l'absence dans un cache local.

#### Code corrigé proposé

```ts
export const saveMissionMutation = async (mission: Mission): Promise<Mission> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  const now = new Date().toISOString();
  const payload = missionToDb({ ...mission, updatedAt: now }, userId);

  const { data, error } = await supabase
    .from('missions')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return dbToMission(data);
};

export const deleteMissionMutation = async (missionId: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Utilisateur non connecté');

  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', missionId)
    .eq('user_id', userId);

  if (error) throw error;
};
```

#### Pourquoi la correction fonctionne

Chaque action utilisateur devient une mutation idempotente et ciblée. Un device ancien ne peut plus supprimer des missions qu'il ne connaît pas. La base redevient la source de vérité, et les caches locaux deviennent uniquement des caches de lecture/offline.

---

### P2 — `localStorage` non partitionné par utilisateur

**Gravité : critique**

#### Description

Les missions, paiements, clients et préférences sont stockés sous des clés globales du navigateur. Elles persistent après logout et sont relues au login suivant, quel que soit l'utilisateur.

#### Cause technique

Les clés de stockage sont constantes et les fonctions `loadMissions` / `saveMissions` ne reçoivent pas `user.id`.

#### Impact

- Données d'un ancien compte visibles dans un nouveau compte sur le même navigateur.
- Données locales d'un compte A poussées vers Supabase du compte B.
- Symptôme direct : après logout/login, missions/objectifs/revenus incohérents.

#### Code problématique

```ts
const STORAGE_KEY = 'NeuroTime_missions_v1';
const PAYMENTS_KEY = 'NeuroTime_payments_v1';
```

#### Correction précise

Toutes les clés locales doivent être dérivées de l'utilisateur authentifié et de l'environnement.

#### Code corrigé proposé

```ts
const storageKey = (userId: string, namespace: string) =>
  `neurotime:${import.meta.env.VITE_SUPABASE_URL}:user:${userId}:${namespace}:v2`;

export const loadMissions = async (userId: string): Promise<Mission[]> => {
  const key = storageKey(userId, 'missions');
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

export const saveMissionsCache = (userId: string, missions: Mission[]) => {
  localStorage.setItem(storageKey(userId, 'missions'), JSON.stringify(missions));
};

export const clearLegacyStorage = () => {
  localStorage.removeItem('NeuroTime_missions_v1');
  localStorage.removeItem('NeuroTime_payments_v1');
  localStorage.removeItem('neurotime_clients_v1');
};
```

#### Pourquoi la correction fonctionne

Le cache local devient isolé par compte. Un navigateur partagé ou un changement de session ne peut plus contaminer la base d'un autre utilisateur.

---

### P3 — Service worker cache les requêtes Supabase

**Gravité : élevé**

#### Description

Le PWA runtime cache intercepte toutes les URL Supabase. Cela inclut REST Auth/PostgREST/Storage/Realtime HTTP fallback selon les endpoints.

#### Cause technique

La règle Workbox `urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i` est trop large.

#### Impact

- Réponses `.select()` servies avec une version stale.
- Refresh qui affiche un état ancien alors que Supabase a bien changé.
- Incohérences accentuées au retour online.
- Risque de caching de réponses sensibles dans Cache Storage.

#### Code problématique

```ts
urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
handler: 'NetworkFirst',
cacheName: 'supabase-cache'
```

#### Correction précise

Ne jamais mettre en cache les APIs Supabase qui portent des données utilisateur. Cacher uniquement les assets statiques. Pour les données offline, utiliser IndexedDB avec une queue de mutations explicite.

#### Code corrigé proposé

```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  navigateFallback: '/index.html',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts-cache' }
    }
  ]
}
```

Et ajouter une règle d'exclusion si nécessaire :

```ts
// Ne pas déclarer de runtimeCaching pour Supabase.
// Les données Supabase doivent être gérées par un cache applicatif versionné.
```

#### Pourquoi la correction fonctionne

Le service worker ne peut plus renvoyer une ancienne réponse API. La cohérence des données redevient déterminée par Supabase + la couche cache applicative contrôlée.

---

### P4 — Absence complète de realtime Supabase

**Gravité : élevé**

#### Description

Aucune subscription `postgres_changes` n'existe. Les sessions ouvertes ne reçoivent pas les changements distants.

#### Cause technique

Le `MissionProvider` charge une fois les données via `loadData()`, puis ne maintient aucune connexion realtime.

#### Impact

- Deux appareils ouverts simultanément divergent immédiatement.
- Les modifications distantes n'apparaissent qu'après refresh ou action manuelle.
- Les autosaves locales peuvent écraser des changements distants jamais reçus.

#### Code problématique

```ts
useEffect(() => {
  loadData();
}, [loadData]);
```

#### Correction précise

Ajouter une subscription unique par `user.id`, nettoyer systématiquement la channel et appliquer les événements par ID sans relancer un snapshot destructif.

#### Code corrigé proposé

```ts
useEffect(() => {
  if (!user || !supabase) return;

  const channel = supabase
    .channel(`missions:user:${user.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'missions', filter: `user_id=eq.${user.id}` },
      payload => {
        setMissions(current => applyMissionEvent(current, payload));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id, supabase]);
```

#### Pourquoi la correction fonctionne

Tous les devices convergent par événements. Le cleanup évite les subscriptions dupliquées, notamment sous React StrictMode.

---

### P5 — Conflits basés sur `updatedAt` local absent et `startTime` métier

**Gravité : élevé**

#### Description

La résolution choisit la version la plus récente selon `updatedAt`, sinon selon `startTime`. Or `updatedAt` n'est pas défini lors de la création/modification locale dans `MissionForm`.

#### Cause technique

`MissionForm` construit `newMission` sans `updatedAt`. Supabase renvoie `updated_at`, mais les versions purement locales/offline n'ont pas d'horloge de modification fiable.

#### Impact

- Offline edit perdue après retour online.
- Une mission future peut gagner contre une mission passée récemment modifiée.
- Résolution différente selon device et timezone.

#### Code problématique

```ts
const localUpdatedAt = localMission.updatedAt || localMission.startTime;
```

#### Correction précise

Toujours assigner `updatedAt` côté client à chaque mutation et idéalement ajouter `version` ou `updated_at` conditionnel côté base.

#### Code corrigé proposé

```ts
const newMission: Mission = {
  ...existingSafeFields,
  id: initialData ? initialData.id : crypto.randomUUID(),
  title,
  client,
  location,
  description,
  startTime: startIso,
  endTime: endIso,
  updatedAt: new Date().toISOString(),
  status,
  rateType: finalRateType,
  hourlyRate: calculationMode === 'auto' ? prefDayRate : 0,
  totalEarnings: finalTotal,
  details: { dayHours, nightHours },
  isPaid: initialData?.isPaid ?? false,
  paymentId: initialData?.paymentId,
};
```

#### Pourquoi la correction fonctionne

La résolution compare des horloges de modification réelles au lieu de dates métier. La préservation de `isPaid`/`paymentId` évite aussi d'effacer l'état de paiement lors d'une édition.

---

### P6 — Dépendances manquantes dans `MissionForm` pour les taux préférés

**Gravité : moyen**

#### Description

Le recalcul automatique dépend de `prefDayRate` et `prefNightRate`, mais l'effet ne les liste pas dans son tableau de dépendances.

#### Cause technique

Le `useEffect` recalcule `computedTotal` seulement quand `timeSlots`, `date` ou `calculationMode` changent.

#### Impact

- Si l'utilisateur modifie ses taux jour/nuit puis sauvegarde une mission sans changer l'heure/date, le total peut rester calculé avec les anciens taux.
- Différences de revenus entre devices si les préférences locales divergent.

#### Code problématique

```ts
useEffect(() => {
  const result = calculateEarningsMultiple(date, timeSlots, prefDayRate, prefNightRate);
  setComputedTotal(result.total);
}, [timeSlots, date, calculationMode]);
```

#### Correction précise

Ajouter `prefDayRate` et `prefNightRate` aux dépendances, ou remplacer l'état dérivé par un `useMemo`.

#### Code corrigé proposé

```ts
useEffect(() => {
  if (calculationMode !== 'auto' || timeSlots.length === 0 || !date) return;
  const result = calculateEarningsMultiple(date, timeSlots, prefDayRate, prefNightRate);
  setDayHours(result.dayHours);
  setNightHours(result.nightHours);
  setComputedTotal(result.total);
}, [timeSlots, date, calculationMode, prefDayRate, prefNightRate]);
```

#### Pourquoi la correction fonctionne

React réexécute le calcul quand les taux changent. Le total sauvegardé correspond à l'état UI courant.

---

### P7 — `DashboardGoals` crée des objectifs par défaut en double sous StrictMode / sessions concurrentes

**Gravité : moyen à élevé**

#### Description

Au montage, si aucun objectif n'est chargé, le composant génère deux IDs aléatoires et appelle `saveGoalsToSupabase`. En React StrictMode, l'effet est monté/démonté/remonté en dev ; sur deux devices ou deux onglets, la même initialisation peut s'exécuter en parallèle.

#### Cause technique

Création de données métier dans un `useEffect` UI non idempotent.

#### Impact

- Objectifs absents ou dupliqués selon timing.
- Erreurs unique `(user_id, type, period)` gérées partiellement.
- Incohérences visuelles car le composant dépend d'un état local sans subscription.

#### Code problématique

```ts
if (loadedGoals.length > 0) {
  setGoals(loadedGoals);
} else {
  const defaultGoals = [
    { id: crypto.randomUUID(), type: 'revenue', target: 5000, period: 'month' },
    { id: crypto.randomUUID(), type: 'missions', target: 10, period: 'month' },
  ];
  setGoals(defaultGoals);
  await saveGoalsToSupabase(defaultGoals);
}
```

#### Correction précise

Déplacer l'initialisation côté DB via `upsert` sur contrainte `(user_id,type,period)` et rendre le fetch idempotent.

#### Code corrigé proposé

```ts
export const ensureDefaultGoals = async (): Promise<Goal[]> => {
  const userId = await getCurrentUserIdOrThrow();
  const defaults = [
    { user_id: userId, type: 'revenue', target: 5000, period: 'month' },
    { user_id: userId, type: 'missions', target: 10, period: 'month' },
  ];

  const { error } = await supabase
    .from('goals')
    .upsert(defaults, { onConflict: 'user_id,type,period', ignoreDuplicates: true });
  if (error) throw error;

  return loadGoalsFromSupabase();
};
```

#### Pourquoi la correction fonctionne

L'unicité est garantie par PostgreSQL. Plusieurs montages/devices peuvent appeler la fonction sans créer de doublons ni supprimer d'objectifs.

---

### P8 — RLS dangereuse : lecture publique des missions terminées

**Gravité : critique si appliqué en production**

#### Description

Le fichier `supabase_public_missions.sql` ajoute une policy qui permet à tout utilisateur, même non authentifié, de lire toutes les missions `completed`.

#### Cause technique

Policy RLS : `USING (status = 'completed')` sans contrainte `auth.uid() = user_id`.

#### Impact

- Exposition de clients, lieux, descriptions, horaires, revenus et détails de mission.
- Violation probable de confidentialité SaaS.
- Data scraping possible via clé anon.

#### Code problématique

```sql
CREATE POLICY "Public can view completed missions" ON missions
  FOR SELECT
  USING (status = 'completed');
```

#### Correction précise

Supprimer cette policy. Si une page publique est nécessaire, créer une table/vue dédiée avec données anonymisées et opt-in explicite.

#### Code corrigé proposé

```sql
DROP POLICY IF EXISTS "Public can view completed missions" ON missions;

CREATE POLICY "Users can view own missions" ON missions
  FOR SELECT
  USING (auth.uid() = user_id);
```

#### Pourquoi la correction fonctionne

La lecture redevient strictement propriétaire. Une exposition publique éventuelle doit passer par un modèle séparé et minimisé.

---

### P9 — Migrations incomplètes pour `payments` et `payment_id`

**Gravité : élevé**

#### Description

Le code utilise `payments`, `mission_ids`, `payment_id`, mais les fichiers SQL versionnés ne créent pas la table `payments` ni la colonne `payment_id` sur `missions`.

#### Cause technique

Le schéma applicatif et les migrations SQL sont désynchronisés.

#### Impact

- Un environnement neuf échoue au chargement/sauvegarde des paiements.
- Les erreurs sont parfois transformées en tableaux vides, donc l'UI peut afficher `0 paiement` au lieu d'un état d'erreur.
- `isPaid` peut diverger entre missions et paiements.

#### Code problématique

```ts
.from('payments').select('*').eq('user_id', userId)
.from('missions').update({ payment_id: payment.id, is_paid: true })
```

#### Correction précise

Ajouter migration complète avec RLS, FK et index.

#### Code corrigé proposé

```sql
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_id UUID;

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  client TEXT NOT NULL,
  description TEXT,
  reference TEXT,
  mission_ids UUID[] NOT NULL DEFAULT '{}',
  method TEXT NOT NULL CHECK (method IN ('virement', 'cash', 'check', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payments" ON payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_missions_user_payment ON missions(user_id, payment_id);
```

#### Pourquoi la correction fonctionne

Tous les environnements ont le même contrat DB que le frontend. RLS protège les paiements et les indexes maintiennent les performances.

---

### P10 — Gestion paiements non transactionnelle

**Gravité : élevé**

#### Description

`savePaymentToSupabase` fait un `upsert` de paiement puis un `update` des missions liées. Si la deuxième requête échoue, paiement et missions divergent.

#### Cause technique

Deux mutations séparées côté client sans transaction PostgreSQL.

#### Impact

- Paiement visible mais missions non marquées payées.
- Mission marquée payée localement mais pas distante si réseau coupe après localStorage.
- Revenus encaissés/prévisionnels différents selon device.

#### Code problématique

```ts
await supabase.from('payments').upsert(paymentDb);
await supabase.from('missions')
  .update({ payment_id: payment.id, is_paid: true })
  .in('id', payment.missionIds)
  .eq('user_id', userId);
```

#### Correction précise

Créer une RPC PostgreSQL `save_payment_with_missions` transactionnelle.

#### Code corrigé proposé

```sql
CREATE OR REPLACE FUNCTION save_payment_with_missions(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO payments (...)
  VALUES (...)
  ON CONFLICT (id) DO UPDATE SET ...;

  UPDATE missions
  SET payment_id = (payload->>'id')::uuid, is_paid = true
  WHERE user_id = auth.uid()
    AND id = ANY(SELECT jsonb_array_elements_text(payload->'missionIds')::uuid);
END;
$$;
```

```ts
const { error } = await supabase.rpc('save_payment_with_missions', { payload: payment });
if (error) throw error;
```

#### Pourquoi la correction fonctionne

PostgreSQL applique tout ou rien. Les états `payments` et `missions` ne peuvent plus diverger partiellement.

---

### P11 — Auth : double source initiale `getCurrentUser` + listener

**Gravité : moyen**

#### Description

`AuthProvider` appelle `getCurrentUser()` puis installe `onAuthStateChange`. Ces deux flux peuvent résoudre dans des ordres différents.

#### Cause technique

Deux écritures concurrentes de `user`/`loading` au montage.

#### Impact

- `MissionProvider` peut charger avec `user=null`, vider l'état, puis recharger.
- À la reconnexion/refresh, l'écran peut afficher temporairement aucune donnée.
- Sous StrictMode, le montage dev double accentue ce comportement.

#### Code problématique

```ts
checkAuth();
const unsubscribe = onAuthStateChange((authUser) => {
  setUser(authUser);
  setLoading(false);
});
```

#### Correction précise

Utiliser `getSession()` comme bootstrap unique, puis listener, avec garde d'annulation.

#### Code corrigé proposé

```ts
useEffect(() => {
  let cancelled = false;

  supabase.auth.getSession().then(({ data }) => {
    if (cancelled) return;
    setUser(toAuthUser(data.session?.user));
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(toAuthUser(session?.user));
    setLoading(false);
  });

  return () => {
    cancelled = true;
    subscription.unsubscribe();
  };
}, []);
```

#### Pourquoi la correction fonctionne

La garde évite d'écrire après cleanup. Le bootstrap explicite de session correspond au modèle Supabase Auth.

---

### P12 — Erreurs Supabase silencieuses transformées en données vides

**Gravité : élevé**

#### Description

Plusieurs fonctions retournent `[]` ou `return` si Supabase échoue ou si l'utilisateur est absent.

#### Cause technique

Les erreurs sont loguées mais non propagées dans les chemins de lecture critiques.

#### Impact

- L'UI ne distingue pas “aucune donnée” de “chargement impossible”.
- `loadMissions` peut fusionner un cache local avec un `[]` distant dû à une erreur, puis réécrire Supabase.
- Debug production difficile, surtout avec `drop_console` en production.

#### Code problématique

```ts
if (!userId) return [];
if (error) {
  console.error('Erreur lors du chargement des paiements:', error);
  return [];
}
```

#### Correction précise

Retourner un résultat typé `Result<T>` ou throw, et empêcher toute sauvegarde de résolution après une erreur distante.

#### Code corrigé proposé

```ts
type LoadResult<T> = { ok: true; data: T } | { ok: false; error: Error };

export const loadMissionsFromSupabase = async (): Promise<LoadResult<Mission[]>> => {
  const { data, error } = await supabase.from('missions').select('*').eq('user_id', userId);
  if (error) return { ok: false, error };
  return { ok: true, data: (data ?? []).map(dbToMission) };
};
```

#### Pourquoi la correction fonctionne

La logique de sync peut bloquer les écritures destructives quand le distant est inconnu.

---

### P13 — Dates locales, DST et différences navigateur

**Gravité : moyen à élevé**

#### Description

Les calculs construisent des dates via `new Date(`${dateStr}T${time}`)` en timezone locale, itèrent minute par minute, puis convertissent en ISO UTC à la sauvegarde.

#### Cause technique

La date métier est locale mais aucun fuseau mission n'est stocké. Les devices dans deux fuseaux différents recalculeront potentiellement des heures différentes. Les transitions DST peuvent ajouter/enlever une heure.

#### Impact

- Revenus différents selon device/fuseau.
- Missions autour du changement d'heure calculées différemment.
- Dashboard mensuel différent si une mission UTC tombe sur un autre jour local.

#### Code problématique

```ts
const start = new Date(`${dateStr}T${startTime}`);
let end = new Date(`${dateStr}T${endTime}`);
const h = current.getHours();
```

#### Correction précise

Stocker explicitement :

- `mission_date` en `DATE` ;
- `start_local_time` / `end_local_time` ;
- `timezone` IANA (`Europe/Paris`) ;
- `start_at_utc` / `end_at_utc` calculés de manière contrôlée ;
- `earnings_snapshot` sauvegardé au moment de validation.

#### Code corrigé proposé

```ts
interface MissionTimeInput {
  missionDate: string; // YYYY-MM-DD
  startLocalTime: string; // HH:mm
  endLocalTime: string; // HH:mm
  timezone: string; // Europe/Paris
}
```

À court terme, ne pas recalculer les revenus partout : sauvegarder `details` et `totalEarnings` comme snapshot validé.

#### Pourquoi la correction fonctionne

Le fuseau fait partie du modèle métier. Les calculs ne dépendent plus du navigateur qui ouvre la mission.

---

### P14 — État dérivé du dashboard mutable par tri in-place

**Gravité : faible à moyen**

#### Description

Certains tableaux issus de `filter` sont triés in-place dans des `useMemo`. Ici le risque est limité car `filter` crée un nouveau tableau, mais le pattern est fragile si refactoré.

#### Correction précise

Toujours copier avant tri :

```ts
const recentCompletedMissions = useMemo(() =>
  [...allCompletedMissions]
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    .slice(0, 5),
  [allCompletedMissions]
);
```

---

## 3. Audit React

### Points critiques détectés

- `MissionProvider` centralise missions + paiements + chargement + autosave dans un seul context : risque de rerenders globaux et responsabilité excessive.
- `addMission`, `updateMission`, `deleteMission` sont optimistes mais sans rollback en cas d'échec Supabase.
- Autosave par `useEffect` sur `missions` : pattern dangereux pour données multi-device.
- `isLoaded && missions.length > 0` empêche de sauvegarder une liste vide, donc une suppression de toutes les missions peut ne jamais être persistée via l'autosave.
- `DashboardGoals` crée des données depuis un composant UI monté, non idempotent.
- `MissionForm` a des dépendances incomplètes pour les taux préférés.
- `MissionForm` charge/synchronise les clients à chaque ouverture et à chaque changement de `missions`, ce qui peut produire des requêtes excessives et des races.
- Le Context expose un objet `value` recréé à chaque render ; sans `useMemo`, tous les consommateurs rerendent.

### Correction structurante React recommandée

- Séparer : `AuthProvider`, `MissionQueryProvider`, `MissionMutationProvider`, `PaymentProvider`, `PreferencesProvider`.
- Utiliser un reducer ou une couche store normalisée par ID.
- Remplacer l'autosave snapshot par mutations explicites.
- Ajouter un état `syncStatus`: `idle | loading | syncing | offline | conflict | error`.
- Ajouter une queue offline persistée IndexedDB.
- Ajouter tests de StrictMode pour vérifier absence de double création.

---

## 4. Audit Supabase / PostgreSQL / RLS

### Auth

- Singleton Supabase présent, c'est positif.
- Bootstrap Auth perfectible : `getCurrentUser()` + listener peuvent écrire dans un ordre non déterministe.
- Les services rappellent `supabase.auth.getUser()` à chaque requête. C'est sécurisé mais coûteux ; il faut centraliser le `user.id` validé ou passer `userId` depuis le context.
- Les erreurs `user non connecté` sont parfois silencieuses.

### Database

Points positifs :

- RLS activée pour `missions`, `goals`, `clients`.
- Policies owner-based présentes dans les scripts principaux.
- Index `(user_id, start_time)` existant pour missions.

Risques :

- `user_id` nullable dans `missions`, `goals`, `clients`. Il devrait être `NOT NULL`.
- `payments` absent des migrations versionnées.
- `payment_id` absent des migrations versionnées.
- Pas de contrainte FK entre `missions.payment_id` et `payments.id`.
- Pas de contrainte empêchant `end_time <= start_time`.
- Pas de modèle soft delete / tombstone pour offline sync.
- Pas de colonne `version` / `updated_by` / `deleted_at`.

### Requêtes

- Les `.eq('user_id', userId)` sont présentes dans la plupart des requêtes, bon point.
- Le danger vient moins d'un manque de filtre que du snapshot destructif.
- Les `.upsert(... onConflict: 'id')` devraient inclure `.select().single()` pour récupérer la version DB canonique.
- Plusieurs erreurs sont ignorées (`existingData` goals sans `error`, `existingClients` sans `error`).

### Realtime

- Aucune subscription détectée.
- À implémenter par table (`missions`, `payments`, `goals`) avec filtre `user_id=eq.${user.id}`.
- Nettoyage obligatoire via `removeChannel`.

### RLS

Critique : supprimer `supabase_public_missions.sql` ou le marquer explicitement “ne jamais appliquer en production”.

SQL recommandé :

```sql
ALTER TABLE missions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "Public can view completed missions" ON missions;
```

---

## 5. Audit PWA / Offline

### Problèmes détectés

- `devOptions.enabled = true` active la PWA en développement, ce qui peut masquer des bugs avec un SW ancien pendant le dev.
- Cache Supabase trop large et dangereux.
- Pas de stratégie explicite IndexedDB.
- Pas de queue de mutations offline.
- Pas de résolution de conflit robuste avec tombstones.
- Pas de bannière “données offline non synchronisées”.
- `localStorage` utilisé comme base offline primaire, insuffisant pour sync fiable.

### Architecture offline fiable recommandée

Utiliser IndexedDB avec trois stores :

1. `entities`: cache normalisé par table + id + userId ;
2. `mutation_queue`: mutations `{id, userId, entity, op, payload, baseVersion, createdAt}` ;
3. `sync_meta`: dernier LSN/time/version par table.

Règles :

- Online : mutation envoyée à Supabase puis cache mis à jour depuis réponse DB.
- Offline : mutation ajoutée à la queue, UI optimiste marquée `pending`.
- Retour online : flush séquentiel avec RPC transactionnelle et contrôle `version`.
- Conflit : ne pas écraser silencieusement ; afficher choix ou merge déterministe.

---

## 6. Audit calculs & dates

### Risques détectés

- `new Date('YYYY-MM-DDTHH:mm')` utilise le fuseau local du navigateur.
- `toISOString()` convertit en UTC ; l'affichage ultérieur dépend de `new Date(iso)` et du fuseau local.
- Les stats mensuelles utilisent `startOfMonth` / `endOfMonth` local, donc un utilisateur en UTC-5 et un autre en Europe/Paris peuvent classer différemment une mission proche de minuit.
- Les heures sont calculées en parcourant chaque minute : simple mais coûteux pour beaucoup de missions et sensible DST.
- Les préférences de taux sont locales uniquement, donc deux devices peuvent produire des revenus différents pour la même mission créée/éditée.

### Recommandations

- Stocker timezone IANA par mission.
- Stocker le snapshot financier final, ne pas recalculer l'historique avec les préférences courantes.
- Ajouter tests DST : dernier dimanche de mars/octobre Europe/Paris.
- Ajouter tests multi-timezone via `TZ=Europe/Paris` et `TZ=America/New_York`.

---

## 7. Audit sécurité

### Critique

- Policy publique des missions terminées si appliquée.
- Données sensibles utilisateur dans Cache Storage si le SW cache Supabase.
- Données utilisateur dans localStorage non chiffré, non partitionné par utilisateur.
- Gemini API key exposée au frontend via `define process.env.GEMINI_API_KEY`; toute clé utilisée côté navigateur doit être considérée publique. Pour une IA premium SaaS, passer par une edge function Supabase avec quotas et audit.

### Élevé

- Pas de schéma RLS `payments` versionné.
- Pas de validation serveur des montants/revenus.
- Logs de données potentiellement sensibles en développement ; en production `drop_console` supprime aussi des signaux de diagnostic.

### Recommandations

- Edge Functions pour Gemini.
- RLS owner-only sur toutes les tables.
- Validation DB : check constraints, FK, NOT NULL.
- Ne pas cacher les endpoints API utilisateur.
- Ajouter audit table optionnelle `mission_events`.

---

## 8. Audit performance

### Problèmes

- Context global : toute modification de mission peut rerender Dashboard, Liste, Paiements, etc.
- Charts/Recharts potentiellement lourds si les tableaux ne sont pas normalisés/sélectés.
- `saveMissionsToSupabase` réécrit potentiellement toute la table utilisateur à chaque petite modification.
- `MissionForm` synchronise clients avec missions à l'ouverture, ce qui peut scanner et insérer beaucoup trop souvent.
- `calculateEarnings` minute par minute peut être optimisé en calcul par segments horaires.

### Recommandations

- Mutations unitaires et queries paginées.
- Context par domaine ou `useSyncExternalStore`/store normalisé.
- Memoization de la valeur du provider.
- Virtualisation si liste missions longue.
- Bundle : ajouter chunk `charts-vendor` pour Recharts.

---

## 9. Plan de correction prioritaire

### Immédiat — avant toute mise en production

1. Supprimer le cache Workbox Supabase.
2. Supprimer/interdire la policy publique des missions terminées.
3. Désactiver la sauvegarde destructive `saveMissionsToSupabase(missions)` ou supprimer la phase `idsToDelete`.
4. Partitionner les clés `localStorage` par `user.id` et nettoyer les clés legacy au logout/login.
5. Ajouter migrations `payments` + `payment_id` + RLS.
6. Faire remonter les erreurs Supabase à l'UI au lieu de retourner `[]` silencieusement.

### Court terme — sprint suivant

1. Mutations unitaires missions/paiements/objectifs.
2. Realtime Supabase avec cleanup strict.
3. `updatedAt` client + réponse DB canonique après mutation.
4. Correction dépendances `MissionForm`.
5. RPC transactionnelle pour paiements.
6. Tests multi-device simulés.

### Moyen terme

1. IndexedDB + queue offline.
2. Versioning DB / conflict detection.
3. Modèle dates avec timezone IANA.
4. Edge function Gemini.
5. Monitoring Sentry/PostHog/Supabase logs.

### Peut attendre

- Optimisation fine Recharts.
- Virtualisation des listes.
- Refactor UI avancé.

---

## 10. Architecture recommandée

### Frontend idéale

```txt
src/
  domains/
    auth/
    missions/
      mission.api.ts
      mission.cache.ts
      mission.reducer.ts
      mission.realtime.ts
      mission.sync.ts
    payments/
    goals/
    preferences/
  infrastructure/
    supabase.ts
    indexeddb.ts
    telemetry.ts
  components/
```

Principes :

- Supabase = source de vérité online.
- IndexedDB = cache durable + queue offline.
- React Context = orchestration légère, pas base de données.
- Mutations explicites, jamais snapshot implicite.
- Realtime pour convergence online.
- RPC pour opérations multi-tables.

### Supabase idéale

Tables :

- `missions(id, user_id, ..., version int, deleted_at, updated_at, timezone)`
- `payments(id, user_id, ..., updated_at)`
- `payment_missions(payment_id, mission_id, user_id)` au lieu d'un tableau `mission_ids` si besoin de requêtes relationnelles robustes.
- `goals(id, user_id, type, period, target, updated_at)`
- `clients(id, user_id, name, normalized_name)`
- `mutation_events` optionnel pour audit.

### Stratégie realtime robuste

- Une channel par table et par user.
- Appliquer événements par ID.
- Ignorer les échos de mutations locales via `clientMutationId` si nécessaire.
- Resync complet non destructif au reconnect.
- Nettoyage dans tous les `useEffect`.

### Stratégie cache fiable

- Service worker : assets seulement.
- IndexedDB : données applicatives par `userId`.
- Cache invalidé par `updated_at/version`.
- Jamais de Cache Storage HTTP pour données Supabase.

### Stratégie offline fiable

- Mutation queue.
- Tombstones pour suppressions.
- Contrôle de version.
- UI “en attente de sync”.
- Gestion explicite des conflits.

---

## 11. Anti-patterns détectés

- `localStorage` comme source de vérité multi-device.
- Écriture snapshot complète déclenchée par `useEffect`.
- Suppression distante déduite de l'absence locale.
- Cache service worker sur API utilisateur.
- Initialisation de données métier dans un composant UI.
- Résolution de conflit basée sur une date métier.
- Erreurs Supabase converties en listes vides.
- Mutations multi-tables non transactionnelles.
- Préférences financières locales influençant des revenus persistés.
- Absence de realtime pour une app multi-device.
- Migrations SQL non synchronisées avec le code.
- RLS publique sur données métier privées.
- API key IA exposée côté frontend.
- Context monolithique qui mélange lecture, mutation, sync, paiement.

---

## 12. Checklist avant production

### Sécurité

- [ ] Supprimer policy publique `Public can view completed missions`.
- [ ] RLS owner-only sur `missions`, `payments`, `goals`, `clients`.
- [ ] `user_id NOT NULL` sur toutes les tables owner-based.
- [ ] Edge function pour Gemini.
- [ ] Pas de données Supabase dans Cache Storage.
- [ ] Tests RLS avec deux utilisateurs.

### Synchronisation

- [ ] Supprimer snapshots destructifs.
- [ ] Mutations unitaires.
- [ ] Realtime par table avec cleanup.
- [ ] Resync non destructif au reconnect.
- [ ] Détection de conflits par `version`/`updated_at`.

### PWA/offline

- [ ] Service worker assets-only.
- [ ] IndexedDB par utilisateur.
- [ ] Queue offline.
- [ ] Tombstones pour suppressions.
- [ ] UI état `offline/pending/conflict`.

### Auth

- [ ] Bootstrap session unique.
- [ ] Nettoyage caches au logout.
- [ ] Tests refresh token / reconnexion.
- [ ] Multi-account dans même navigateur.

### Tests

- [ ] Tests unitaires calculs dates/revenus.
- [ ] Tests DST/timezone.
- [ ] Tests StrictMode.
- [ ] Tests intégration Supabase avec deux users.
- [ ] Tests offline/online Playwright.
- [ ] Tests concurrence : deux devices modifient même mission.

### Observabilité

- [ ] Sentry ou équivalent.
- [ ] Logs structurés de sync.
- [ ] Métriques : queue offline, conflits, erreurs Supabase.
- [ ] Alertes RLS/API errors.
- [ ] Feature flags pour PWA/offline.

---

## 13. Vérifications finales obligatoires

| Cause possible | Verdict | Preuve / commentaire |
|---|---:|---|
| React StrictMode | Possible en dev, amplifie certains effets | StrictMode actif dans `src/index.tsx`; création objectifs dans `useEffect` non idempotent. |
| Subscriptions realtime dupliquées | Non détecté | Aucune subscription realtime trouvée ; le problème est plutôt l'absence de realtime. |
| Plusieurs clients Supabase instanciés | Peu probable | Singleton dans `authService.ts`; bon point. |
| Mauvaises RLS policies | Oui critique si script appliqué | Policy publique des missions terminées. |
| Données non filtrées par `user_id` | Partiellement | Requêtes principales filtrées, mais policy publique contourne la confidentialité et localStorage n'est pas user-scopé. |
| Stale closures | Oui ponctuel | `MissionForm` dépendances incomplètes pour taux préférés ; handlers goals utilisent état local courant. |
| `useEffect` exécutés plusieurs fois | Oui | StrictMode + effets de chargement/création ; autosave par effet. |
| Race conditions async | Oui critique | Load local + load remote + save resolved + autosave concurrent. |
| Cache PWA | Oui élevé | Cache Supabase pendant 1h. |
| Service worker ancien | Possible | AutoUpdate présent, mais dev PWA activée et caches runtime persistants. |
| localStorage obsolète | Oui critique | Source principale de fallback et non scopée user. |
| IndexedDB corrompu | Non applicable | IndexedDB non utilisé. |
| Timezone UTC/local | Oui moyen/élevé | Dates locales converties en ISO UTC sans timezone métier. |
| Calculs différents selon navigateur | Possible | Parsing dates locales + DST + préférences locales. |
| Optimistic updates cassées | Oui | Pas de rollback ni statut pending. |
| État React partagé incorrectement | Oui | Context monolithique + autosave global. |
| Fetch concurrents | Oui | Chargements/sauvegardes parallèles missions/paiements/objectifs. |
| Listeners non nettoyés | Globalement OK | Auth cleanup présent ; pas de realtime. |
| Offline sync conflictuel | Oui critique | Pas de queue, résolution heuristique par dates. |

---

## 14. Notes globales

| Dimension | Note / 10 | Commentaire |
|---|---:|---|
| Fiabilité | 3 | Risque élevé de divergence et perte de données. |
| Sécurité | 4 | RLS de base correcte, mais policy publique/cache/API key problématiques. |
| Maintenabilité | 5 | Code lisible, mais responsabilités sync dispersées. |
| Scalabilité | 4 | Snapshots complets et context global ne scaleront pas. |
| Qualité architecture | 4 | Architecture simple mais insuffisante pour multi-device/offline. |
| Robustesse realtime | 1 | Realtime absent. |
| Robustesse offline | 2 | Offline implicite via localStorage, non fiable. |
| Cohérence données | 2 | Source de vérité ambiguë et conflits destructifs. |

## Conclusion

Le problème principal est architectural : NeuroTime traite simultanément `localStorage`, React state et Supabase comme sources de vérité. Pour une application SaaS premium multi-device/offline, il faut établir un modèle clair : Supabase comme vérité online, IndexedDB comme cache/queue offline, mutations unitaires, realtime pour convergence et transactions/RPC pour opérations multi-tables. Les corrections immédiates doivent viser la prévention de perte de données : retirer le cache Supabase, supprimer les snapshots destructifs, partitionner le stockage local par utilisateur et verrouiller les RLS.
