# Prompt Codex — Corrections critiques NeuroTime

> Copie ce prompt tel quel dans Codex. Il est structuré en tâches autonomes et ordonnées.
> Codex peut les exécuter séquentiellement ou en parallèle selon sa configuration.

---

## Contexte du projet

Tu travailles sur **NeuroTime**, une PWA React 19 / TypeScript / Supabase pour la gestion de missions freelance dans l'événementiel.

Stack : React 19, TypeScript strict, Vite, Tailwind CSS 4, Supabase (PostgreSQL + Auth + RLS), Workbox PWA, React Router 7, Recharts, Google Gemini SDK.

Structure des fichiers clés :
- `src/context/MissionContext.tsx` — state global missions + paiements
- `src/context/AuthContext.tsx` — session auth
- `src/services/supabaseService.ts` — toutes les mutations Supabase
- `src/services/storageService.ts` — localStorage helpers
- `src/services/goalsService.ts` — CRUD objectifs
- `src/components/MissionForm.tsx` — formulaire création/édition mission
- `src/components/DashboardGoals.tsx` — objectifs utilisateur
- `src/types.ts` — types TypeScript centralisés
- `vite.config.ts` — config Vite + Workbox PWA
- `supabase/migrations/` — fichiers SQL versionnés

---

## TÂCHE 1 — Supprimer le cache Workbox sur les APIs Supabase

**Fichier :** `vite.config.ts`

**Problème :** La règle `urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i` avec `handler: 'NetworkFirst'` met en cache les réponses API Supabase pendant 1 heure. Des données obsolètes sont renvoyées au lieu des données réelles, causant des incohérences multi-device et un risque de cacher des données sensibles dans le Cache Storage du navigateur.

**Modification à effectuer :**
Supprimer entièrement la règle `runtimeCaching` qui cible `*.supabase.co`. Conserver uniquement les règles pour les assets statiques (Google Fonts). Ne jamais ajouter de règle de cache pour des URLs Supabase.

**Résultat attendu dans `vite.config.ts` :**
```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/@/, /^\/node_modules/, /supabase\.co/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] }
      }
    }
  ]
}
```

---

## TÂCHE 2 — Partitionner le localStorage par userId

**Fichiers :** `src/services/storageService.ts`, `src/services/clientService.ts`, `src/services/preferencesService.ts`

**Problème :** Les clés `NeuroTime_missions_v1`, `NeuroTime_payments_v1`, `neurotime_clients_v1`, `neurotime_preferences_v1` sont globales au navigateur. Après un logout/login ou un changement de compte, les données d'un utilisateur peuvent être lues et poussées vers Supabase d'un autre utilisateur.

**Modifications à effectuer :**

1. Dans `storageService.ts`, remplacer toutes les constantes de clés globales par une fonction qui inclut le `userId` et l'URL Supabase :

```ts
const storageKey = (userId: string, namespace: string): string =>
  `neurotime:${import.meta.env.VITE_SUPABASE_URL}:user:${userId}:${namespace}:v2`;
```

2. Modifier toutes les fonctions `loadMissions`, `saveMissions`, `loadPayments`, `savePayments` pour accepter `userId: string` en premier paramètre et utiliser `storageKey(userId, 'missions')` etc.

3. Ajouter cette fonction d'utilitaire dans `storageService.ts` :

```ts
export const clearLegacyStorage = (): void => {
  const legacyKeys = [
    'NeuroTime_missions_v1',
    'NeuroTime_payments_v1',
    'neurotime_clients_v1',
    'neurotime_preferences_v1',
  ];
  legacyKeys.forEach(k => localStorage.removeItem(k));
};
```

4. Adapter `clientService.ts` et `preferencesService.ts` de la même façon pour leurs clés respectives.

5. S'assurer que `clearLegacyStorage()` est appelée dans `AuthContext.tsx` à la fois au `signOut` et au `signIn` (pour nettoyer un éventuel cache d'une session précédente).

---

## TÂCHE 3 — Remplacer la sauvegarde snapshot destructive par des mutations unitaires

**Fichiers :** `src/services/supabaseService.ts`, `src/context/MissionContext.tsx`

**Problème :** La fonction `saveMissionsToSupabase` calcule les IDs absents du tableau React local et les supprime de Supabase. Un device avec un cache local ancien peut supprimer des missions créées sur un autre device. L'autosave via `useEffect` sur `missions` amplifie ce problème.

**Modifications à effectuer :**

### Dans `src/services/supabaseService.ts`

Ajouter ces deux fonctions et conserver l'existant pour la compatibilité des imports (mais ne plus les appeler depuis le contexte) :

```ts
export const saveMissionMutation = async (mission: Mission): Promise<Mission> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Utilisateur non connecté');

  const now = new Date().toISOString();
  const payload = missionToDb({ ...mission, updatedAt: now }, user.id);

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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Utilisateur non connecté');

  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', missionId)
    .eq('user_id', user.id);

  if (error) throw error;
};
```

### Dans `src/context/MissionContext.tsx`

1. Supprimer le `useEffect` d'autosave snapshot (celui qui observe `missions` et appelle `saveMissions(missions)` après un délai).

2. Modifier `addMission` pour utiliser `saveMissionMutation` avec rollback optimiste :

```ts
const addMission = useCallback(async (missionData: Omit<Mission, 'id'>) => {
  const newMission: Mission = {
    ...missionData,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  // Optimistic update
  setMissions(prev => [newMission, ...prev]);
  try {
    const saved = await saveMissionMutation(newMission);
    setMissions(prev => prev.map(m => m.id === saved.id ? saved : m));
  } catch (error) {
    // Rollback
    setMissions(prev => prev.filter(m => m.id !== newMission.id));
    throw error;
  }
}, []);
```

3. Modifier `updateMission` de la même façon avec rollback :

```ts
const updateMission = useCallback(async (id: string, updates: Partial<Mission>) => {
  const previous = missions.find(m => m.id === id);
  const updated = { ...previous, ...updates, id, updatedAt: new Date().toISOString() } as Mission;
  setMissions(prev => prev.map(m => m.id === id ? updated : m));
  try {
    const saved = await saveMissionMutation(updated);
    setMissions(prev => prev.map(m => m.id === saved.id ? saved : m));
  } catch (error) {
    if (previous) setMissions(prev => prev.map(m => m.id === id ? previous : m));
    throw error;
  }
}, [missions]);
```

4. Modifier `deleteMission` pour utiliser `deleteMissionMutation` avec rollback :

```ts
const deleteMission = useCallback(async (id: string) => {
  const previous = missions.find(m => m.id === id);
  setMissions(prev => prev.filter(m => m.id !== id));
  try {
    await deleteMissionMutation(id);
  } catch (error) {
    if (previous) setMissions(prev => [previous, ...prev]);
    throw error;
  }
}, [missions]);
```

---

## TÂCHE 4 — Ajouter les subscriptions Realtime Supabase

**Fichier :** `src/context/MissionContext.tsx`

**Problème :** Aucune subscription `postgres_changes` n'existe. Deux appareils ouverts simultanément divergent immédiatement. Les modifications distantes n'apparaissent qu'après un reload manuel.

**Modifications à effectuer :**

1. Ajouter la fonction utilitaire `applyMissionEvent` dans le fichier (hors du composant) :

```ts
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

function applyMissionEvent(
  current: Mission[],
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
): Mission[] {
  const { eventType } = payload;
  if (eventType === 'INSERT') {
    const newRecord = payload.new;
    const exists = current.find(m => m.id === newRecord.id);
    return exists ? current : [dbToMission(newRecord as any), ...current];
  }
  if (eventType === 'UPDATE') {
    const newRecord = payload.new;
    return current.map(m => m.id === newRecord.id ? dbToMission(newRecord as any) : m);
  }
  if (eventType === 'DELETE') {
    const oldRecord = payload.old;
    return current.filter(m => m.id !== oldRecord.id);
  }
  return current;
}
```

2. Dans `MissionProvider`, ajouter un `useEffect` pour les subscriptions (après le `useEffect` de chargement initial) :

```ts
useEffect(() => {
  if (!user?.id) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const channel = supabase
    .channel(`missions:user:${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'missions',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        setMissions(current => applyMissionEvent(current, payload));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);
```

3. Ajouter une subscription identique pour `payments` dans `MissionContext` (ou dans le provider qui gère les paiements) avec la même structure et un `filter: \`user_id=eq.${user.id}\``.

---

## TÂCHE 5 — Corriger AuthContext : bootstrap déterministe

**Fichier :** `src/context/AuthContext.tsx`

**Problème :** `getCurrentUser()` et `onAuthStateChange()` peuvent écrire `user` dans un ordre imprévisible. Sous React StrictMode, cela peut vider momentanément l'état et déclencher un rechargement complet des données.

**Modification à effectuer :**

Remplacer le pattern actuel par `getSession()` comme source unique de bootstrap, avec une garde d'annulation pour éviter les écritures après cleanup :

```ts
useEffect(() => {
  let cancelled = false;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  supabase.auth.getSession().then(({ data }) => {
    if (cancelled) return;
    setUser(toAuthUser(data.session?.user ?? null));
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(toAuthUser(session?.user ?? null));
    setLoading(false);
    if (!session) {
      clearLegacyStorage(); // importer depuis storageService.ts
    }
  });

  return () => {
    cancelled = true;
    subscription.unsubscribe();
  };
}, []);
```

---

## TÂCHE 6 — Corriger MissionForm : updatedAt et dépendances useEffect

**Fichier :** `src/components/MissionForm.tsx`

**Problème A :** `updatedAt` n'est jamais assigné lors de la création/modification locale. La résolution de conflits retombe sur `startTime` (date métier).

**Problème B :** Le `useEffect` qui recalcule les revenus n'inclut pas `prefDayRate` et `prefNightRate` dans ses dépendances. Le total peut être calculé avec d'anciens taux si l'utilisateur les modifie.

**Modifications à effectuer :**

1. Dans la construction de `newMission` (lors du submit), toujours assigner `updatedAt` et préserver `paymentId` :

```ts
const newMission: Mission = {
  id: initialData ? initialData.id : crypto.randomUUID(),
  title,
  client,
  location,
  description,
  startTime: startIso,
  endTime: endIso,
  updatedAt: new Date().toISOString(), // ← TOUJOURS renseigner
  status,
  rateType: finalRateType,
  hourlyRate: calculationMode === 'auto' ? prefDayRate : customRate,
  totalEarnings: finalTotal,
  details: { dayHours, nightHours },
  isPaid: initialData?.isPaid ?? false,
  paymentId: initialData?.paymentId, // ← préserver l'état de paiement
};
```

2. Corriger les dépendances du `useEffect` de calcul des revenus :

```ts
useEffect(() => {
  if (calculationMode !== 'auto' || timeSlots.length === 0 || !date) return;
  const result = calculateEarningsMultiple(date, timeSlots, prefDayRate, prefNightRate);
  setDayHours(result.dayHours);
  setNightHours(result.nightHours);
  setComputedTotal(result.total);
}, [timeSlots, date, calculationMode, prefDayRate, prefNightRate]); // ← dépendances complètes
```

---

## TÂCHE 7 — Rendre l'initialisation des objectifs idempotente

**Fichiers :** `src/services/goalsService.ts`, `src/components/DashboardGoals.tsx`

**Problème :** `DashboardGoals` crée des objectifs par défaut avec `crypto.randomUUID()` dans un `useEffect`. Sous React StrictMode (double montage), ou sur deux onglets simultanés, des doublons sont créés.

**Modifications à effectuer :**

### Dans `src/services/goalsService.ts`

Ajouter la fonction suivante (elle remplace la logique de création locale) :

```ts
export const ensureDefaultGoals = async (): Promise<Goal[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Non authentifié');

  const defaults = [
    { user_id: user.id, type: 'revenue' as const, target: 5000, period: 'month' as const },
    { user_id: user.id, type: 'missions' as const, target: 10, period: 'month' as const },
  ];

  const { error } = await supabase
    .from('goals')
    .upsert(defaults, { onConflict: 'user_id,type,period', ignoreDuplicates: true });

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id);

  if (fetchError) throw fetchError;
  return (data ?? []).map(dbToGoal);
};
```

### Dans `src/components/DashboardGoals.tsx`

Remplacer la logique d'initialisation locale par un appel à `ensureDefaultGoals()` :

```ts
useEffect(() => {
  if (!user?.id) return;
  ensureDefaultGoals()
    .then(setGoals)
    .catch(err => console.error('Erreur initialisation objectifs:', err));
}, [user?.id]); // dépendance sur user.id uniquement
```

---

## TÂCHE 8 — Typer les résultats Supabase pour éliminer les erreurs silencieuses

**Fichiers :** `src/services/supabaseService.ts`, `src/services/goalsService.ts`, tout service avec des `.select()`

**Problème :** Les erreurs Supabase sont converties en `[]` ou ignorées. L'UI ne distingue pas "aucune donnée" de "erreur réseau", ce qui peut déclencher des sauvegardes destructives sur un état vide.

**Modifications à effectuer :**

1. Ajouter ce type dans `src/types.ts` :

```ts
export type LoadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Error | { message: string } };
```

2. Modifier `loadMissionsFromSupabase` (et les fonctions équivalentes pour `payments`, `goals`, `clients`) pour retourner `LoadResult<T>` au lieu de `T | []` :

```ts
export const loadMissionsFromSupabase = async (): Promise<LoadResult<Mission[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: new Error('Supabase non configuré') };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: new Error('Non authentifié') };

  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false });

  if (error) return { ok: false, error };
  return { ok: true, data: (data ?? []).map(dbToMission) };
};
```

3. Dans `MissionContext.tsx`, adapter les appels pour ne pas écraser les données locales en cas d'erreur :

```ts
const result = await loadMissionsFromSupabase();
if (!result.ok) {
  console.error('Erreur chargement missions:', result.error);
  // Afficher l'erreur à l'utilisateur via toast/notification
  // NE PAS écraser les données locales existantes
  return;
}
setMissions(result.data);
```

---

## TÂCHE 9 — Mémoïser la valeur du MissionContext Provider

**Fichier :** `src/context/MissionContext.tsx`

**Problème :** Le Provider recrée l'objet `value` à chaque render, forçant tous les composants consommateurs à re-rendre même quand les données n'ont pas changé.

**Modification à effectuer :**

Entourer la valeur du Provider avec `useMemo` :

```ts
const contextValue = useMemo(() => ({
  missions,
  payments,
  isLoading,
  error,
  addMission,
  updateMission,
  deleteMission,
  // ... toutes les autres propriétés exposées
}), [
  missions,
  payments,
  isLoading,
  error,
  addMission,
  updateMission,
  deleteMission,
]);

return (
  <MissionContext.Provider value={contextValue}>
    {children}
  </MissionContext.Provider>
);
```

S'assurer que toutes les fonctions exposées (`addMission`, `updateMission`, `deleteMission`, etc.) sont bien enveloppées dans `useCallback` avec leurs dépendances correctes.

---

## TÂCHE 10 — Corriger les tris in-place sur les tableaux React

**Fichiers :** `src/components/Dashboard.tsx`, `src/components/StatsView.tsx`, tous les composants avec `.sort()` dans des `useMemo`

**Problème :** Des tableaux issus du state React sont triés directement avec `.sort()` sans être copiés d'abord. Bien que `filter()` crée un nouveau tableau, les refactorisations futures pourraient muter l'état.

**Modification à effectuer :**

Systématiquement préfixer chaque `.sort()` par un spread operator pour copier le tableau :

```ts
// ❌ Avant
const sorted = missions.sort((a, b) => ...);

// ✅ Après — dans tous les useMemo
const recentMissions = useMemo(() =>
  [...missions]
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    .slice(0, 5),
  [missions]
);
```

Rechercher tous les `.sort(` dans les fichiers de composants et s'assurer qu'ils opèrent tous sur une copie (`[...array].sort(...)` ou `array.slice().sort(...)`).

---

## TÂCHE 11 — Créer la migration SQL complète pour payments

**Fichier à créer :** `supabase/migrations/YYYYMMDDHHMMSS_add_payments_table.sql`
(remplacer `YYYYMMDDHHMMSS` par le timestamp actuel)

**Problème :** La table `payments` et la colonne `payment_id` sur `missions` sont utilisées dans le code TypeScript mais absentes des migrations versionnées. Un environnement neuf échoue silencieusement.

**Contenu exact du fichier de migration :**

```sql
-- Migration : ajout de la table payments et de la colonne payment_id sur missions

-- 1. Colonne payment_id sur missions (si absente)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_id UUID;

-- 2. Contrainte logique : end_time > start_time
ALTER TABLE missions
  ADD CONSTRAINT IF NOT EXISTS chk_missions_time_order
  CHECK (end_time > start_time);

-- 3. user_id NOT NULL sur toutes les tables owner-based
ALTER TABLE missions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;

-- 4. Table payments
CREATE TABLE IF NOT EXISTS payments (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE          NOT NULL,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  client      TEXT          NOT NULL,
  description TEXT,
  reference   TEXT,
  mission_ids UUID[]        NOT NULL DEFAULT '{}',
  method      TEXT          NOT NULL CHECK (method IN ('virement', 'cash', 'check', 'other')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 5. RLS sur payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payments" ON payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. FK entre missions.payment_id et payments.id
ALTER TABLE missions
  ADD CONSTRAINT IF NOT EXISTS fk_missions_payment_id
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- 7. Trigger updated_at sur payments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Index de performance
CREATE INDEX IF NOT EXISTS idx_payments_user_date    ON payments(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_missions_user_payment ON missions(user_id, payment_id);

-- 9. Supprimer la policy publique dangereuse si elle existe
DROP POLICY IF EXISTS "Public can view completed missions" ON missions;

-- S'assurer qu'une policy SELECT owner-only existe pour missions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'missions' AND policyname = 'Users can view own missions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own missions" ON missions
      FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;
```

---

## TÂCHE 12 — Créer la RPC transactionnelle pour les paiements

**Fichier à créer :** `supabase/migrations/YYYYMMDDHHMMSS_add_save_payment_rpc.sql`

**Problème :** L'enregistrement d'un paiement fait deux requêtes séparées (upsert payment + update missions). Si la seconde échoue, le paiement existe mais les missions ne sont pas marquées payées.

**Contenu du fichier SQL :**

```sql
CREATE OR REPLACE FUNCTION save_payment_with_missions(
  p_payment_id  UUID,
  p_user_id     UUID,
  p_date        DATE,
  p_amount      NUMERIC,
  p_client      TEXT,
  p_description TEXT,
  p_reference   TEXT,
  p_mission_ids UUID[],
  p_method      TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Vérifier que l'appelant est bien le propriétaire (double sécurité RLS)
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Upsert atomique du paiement
  INSERT INTO payments (id, user_id, date, amount, client, description, reference, mission_ids, method)
  VALUES (p_payment_id, p_user_id, p_date, p_amount, p_client, p_description, p_reference, p_mission_ids, p_method)
  ON CONFLICT (id) DO UPDATE SET
    amount      = EXCLUDED.amount,
    description = EXCLUDED.description,
    reference   = EXCLUDED.reference,
    mission_ids = EXCLUDED.mission_ids,
    updated_at  = now();

  -- Mise à jour atomique des missions liées
  UPDATE missions
  SET
    payment_id = p_payment_id,
    is_paid    = true,
    updated_at = now()
  WHERE
    user_id = p_user_id
    AND id = ANY(p_mission_ids);
END;
$$;
```

**Dans `src/services/supabaseService.ts`, remplacer le double-appel par la RPC :**

```ts
export const savePaymentToSupabase = async (payment: Payment): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Utilisateur non connecté');

  const { error } = await supabase.rpc('save_payment_with_missions', {
    p_payment_id:  payment.id,
    p_user_id:     user.id,
    p_date:        payment.date,
    p_amount:      payment.amount,
    p_client:      payment.client,
    p_description: payment.description ?? '',
    p_reference:   payment.reference ?? '',
    p_mission_ids: payment.missionIds,
    p_method:      payment.method,
  });

  if (error) throw error;
};
```

---

## Contraintes générales à respecter pour toutes les tâches

- **TypeScript strict** : pas de `any`, pas d'`as unknown`. Utiliser les types existants de `src/types.ts`.
- **Pas de régression de fonctionnalité** : les corrections ne doivent pas changer le comportement visible pour l'utilisateur, seulement le rendre plus fiable.
- **Imports** : tous les nouveaux imports doivent utiliser les chemins relatifs existants du projet.
- **Aucun `console.log`** de debug laissé dans le code final (utiliser `console.error` uniquement pour les erreurs inattendues).
- **Tester après chaque tâche** : vérifier que `tsc --noEmit` ne retourne aucune erreur après chaque modification.
- **Ordre d'exécution recommandé** : Tâche 1 → 2 → 11 → 8 → 3 → 5 → 4 → 6 → 7 → 12 → 9 → 10.

---

*Prompt généré le 29 mai 2026 — basé sur l'audit technique NeuroTime v2.0*
