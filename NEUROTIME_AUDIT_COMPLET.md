# 🔍 AUDIT COMPLET — NeuroTime
**Date :** 29 mai 2026  
**Périmètre :** React 19, TypeScript, Supabase, RLS, PWA/Workbox, calculs dates/revenus, sécurité, performance  
**Statut global :** ⚠️ NON PRÊT POUR LA PRODUCTION — corrections critiques requises

---

## 📊 Résumé exécutif

| Dimension | Note / 10 | Verdict |
|---|:---:|---|
| Fiabilité des données | 3 | ❌ Risque de perte de données multi-device |
| Sécurité | 4 | ❌ Faille RLS publique + API key exposée |
| Maintenabilité | 5 | ⚠️ Code lisible, synchronisation dispersée |
| Scalabilité | 4 | ❌ Snapshots complets ne scaleront pas |
| Architecture | 4 | ⚠️ Insuffisante pour offline/multi-device |
| Realtime | 1 | ❌ Absent — divergence garantie |
| Robustesse offline | 2 | ❌ localStorage non fiable |
| Cohérence données | 2 | ❌ Source de vérité ambiguë |

**Problème racine :** NeuroTime traite simultanément `localStorage`, React state et Supabase comme sources de vérité concurrentes. Chaque navigateur devient une source de vérité indépendante qui peut écraser les autres.

---

## 🚨 PROBLÈMES CRITIQUES (à corriger avant toute mise en production)

---

### P1 — Sauvegarde destructive par snapshot complet ❌ CRITIQUE

**Fichiers :** `src/services/supabaseService.ts`, `src/context/MissionContext.tsx`

**Description :** Chaque modification de mission déclenche une sauvegarde de toute la liste. Cette sauvegarde supprime de Supabase toutes les missions absentes du tableau React local. Un device avec une liste ancienne peut supprimer des missions créées sur un autre device.

**Code problématique :**
```ts
// ❌ DANGER : supprime des missions existantes en DB si absentes en local
const idsToDelete = Array.from(existingIds).filter(id => !missionIds.has(id));
if (idsToDelete.length > 0) {
  await supabase.from('missions').delete().in('id', idsToDelete).eq('user_id', userId);
}
await supabase.from('missions').upsert(missionsDbFiltered, { onConflict: 'id' });
```

**Impact :** Perte silencieuse de données en production. Missions créées sur desktop supprimées par le mobile au prochain autosave.

**Correction — remplacer par des mutations unitaires :**
```ts
// ✅ CORRECTION : mutation unitaire idempotente
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

**Dans `MissionContext.tsx`, remplacer l'autosave snapshot :**
```ts
// ❌ SUPPRIMER CE PATTERN :
useEffect(() => {
  if (isLoaded && missions.length > 0) {
    saveMissions(missions); // snapshot destructif
  }
}, [missions]);

// ✅ À LA PLACE : appeler saveMissionMutation() directement dans addMission/updateMission
const addMission = useCallback(async (missionData: Omit<Mission, 'id'>) => {
  const newMission = { ...missionData, id: crypto.randomUUID() };
  setMissions(prev => [newMission, ...prev]); // optimistic update
  try {
    const saved = await saveMissionMutation(newMission);
    setMissions(prev => prev.map(m => m.id === saved.id ? saved : m));
  } catch (error) {
    setMissions(prev => prev.filter(m => m.id !== newMission.id)); // rollback
    throw error;
  }
}, []);
```

---

### P2 — `localStorage` non partitionné par utilisateur ❌ CRITIQUE

**Fichiers :** `src/services/storageService.ts`, `src/services/clientService.ts`, `src/services/preferencesService.ts`

**Description :** Les clés de stockage sont globales. Après logout/login ou changement de compte dans le même navigateur, les données d'un compte peuvent être poussées vers Supabase d'un autre compte.

**Code problématique :**
```ts
// ❌ Clés globales, non liées à l'utilisateur
const STORAGE_KEY = 'NeuroTime_missions_v1';
const PAYMENTS_KEY = 'NeuroTime_payments_v1';
localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
```

**Correction :**
```ts
// ✅ Clés scopées par userId + environnement
const storageKey = (userId: string, namespace: string): string =>
  `neurotime:${import.meta.env.VITE_SUPABASE_URL}:user:${userId}:${namespace}:v2`;

export const loadMissionsCache = (userId: string): Mission[] => {
  const key = storageKey(userId, 'missions');
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMissionsCache = (userId: string, missions: Mission[]): void => {
  const key = storageKey(userId, 'missions');
  localStorage.setItem(key, JSON.stringify(missions));
};

// Appeler au logout et au login pour nettoyer les clés legacy
export const clearLegacyStorage = (): void => {
  const legacyKeys = [
    'NeuroTime_missions_v1',
    'NeuroTime_payments_v1',
    'neurotime_clients_v1',
    'neurotime_preferences_v1',
  ];
  legacyKeys.forEach(k => localStorage.removeItem(k));
};

// Dans AuthContext : appeler clearLegacyStorage() au signOut et au signIn
```

---

### P3 — Cache PWA sur les APIs Supabase ❌ CRITIQUE

**Fichier :** `vite.config.ts`

**Description :** Workbox met en cache toutes les URLs `*.supabase.co` avec NetworkFirst pendant 1h. Des réponses obsolètes peuvent être servies à la place des données réelles, causant des incohérences multi-device.

**Code problématique :**
```ts
// ❌ Cache les données utilisateur — DANGEREUX
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

**Correction dans `vite.config.ts` :**
```ts
// ✅ Ne JAMAIS cacher les APIs Supabase (données utilisateur)
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/@/, /^\/node_modules/, /supabase\.co/],
  runtimeCaching: [
    // Fonts uniquement — assets statiques
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
    // ❌ PAS de règle pour Supabase — les données doivent être fraîches
  ]
}
```

---

### P8 — RLS publique sur les missions terminées ❌ CRITIQUE SÉCURITÉ

**Fichier :** `supabase_public_missions.sql` (ne jamais appliquer en production)

**Description :** Une policy permet à n'importe qui, même non authentifié, de lire toutes les missions avec le statut `completed`. Cela expose clients, lieux, revenus et horaires de tous les utilisateurs.

**Code dangereux :**
```sql
-- ❌ CRITIQUE : tout le monde peut lire les missions terminées sans auth
CREATE POLICY "Public can view completed missions" ON missions
  FOR SELECT
  USING (status = 'completed');
```

**Correction SQL à exécuter immédiatement :**
```sql
-- ✅ Supprimer la policy publique
DROP POLICY IF EXISTS "Public can view completed missions" ON missions;

-- ✅ Garantir que seul le propriétaire peut lire ses missions
CREATE POLICY "Users can view own missions" ON missions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ✅ Rendre user_id obligatoire sur toutes les tables owner-based
ALTER TABLE missions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
```

---

### P9 — Migrations manquantes pour `payments` et `payment_id` ❌ CRITIQUE

**Description :** Le code TypeScript utilise une table `payments` et une colonne `payment_id` dans `missions`, mais aucun fichier SQL versionné ne les crée. Un environnement neuf échoue silencieusement.

**Migration SQL complète à ajouter :**
```sql
-- ✅ Ajouter payment_id sur missions (si absent)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_id UUID;

-- ✅ Créer la table payments avec RLS complète
CREATE TABLE IF NOT EXISTS payments (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE          NOT NULL,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  client        TEXT          NOT NULL,
  description   TEXT,
  reference     TEXT,
  mission_ids   UUID[]        NOT NULL DEFAULT '{}',
  method        TEXT          NOT NULL CHECK (method IN ('virement', 'cash', 'check', 'other')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payments" ON payments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ Indexes de performance
CREATE INDEX IF NOT EXISTS idx_payments_user_date      ON payments(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_missions_user_payment   ON missions(user_id, payment_id);

-- ✅ Contrainte FK entre missions.payment_id et payments.id
ALTER TABLE missions
  ADD CONSTRAINT fk_missions_payment_id
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- ✅ Contrainte logique : end_time > start_time
ALTER TABLE missions
  ADD CONSTRAINT chk_missions_time_order
  CHECK (end_time > start_time);
```

---

## ⚠️ PROBLÈMES ÉLEVÉS (sprint suivant)

---

### P4 — Absence totale de Realtime Supabase ⚠️ ÉLEVÉ

**Fichier :** `src/context/MissionContext.tsx`

**Description :** Aucune subscription `postgres_changes` n'existe. Deux appareils ouverts en même temps divergent immédiatement et ne convergent qu'au reload suivant.

**Correction à ajouter dans `MissionContext.tsx` :**
```ts
// ✅ Subscription realtime par utilisateur, avec cleanup strict
useEffect(() => {
  if (!user?.id || !supabase) return;

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

// Fonction de merge par événement (non destructif)
function applyMissionEvent(current: Mission[], payload: any): Mission[] {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  if (eventType === 'INSERT') {
    const exists = current.find(m => m.id === newRecord.id);
    return exists ? current : [dbToMission(newRecord), ...current];
  }
  if (eventType === 'UPDATE') {
    return current.map(m => m.id === newRecord.id ? dbToMission(newRecord) : m);
  }
  if (eventType === 'DELETE') {
    return current.filter(m => m.id !== oldRecord.id);
  }
  return current;
}
```

**Ajouter aussi pour `payments` et `goals` :**
```ts
// Pattern identique pour payments
const paymentsChannel = supabase
  .channel(`payments:user:${user.id}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
    (payload) => { /* applyPaymentEvent */ }
  ).subscribe();
```

---

### P5 — `updatedAt` absent lors des mutations locales ⚠️ ÉLEVÉ

**Fichier :** `src/components/MissionForm.tsx`

**Description :** La résolution de conflits compare `updatedAt`, mais ce champ n'est jamais assigné lors d'une création/modification locale. La résolution retombe alors sur `startTime` (date métier), ce qui est incorrect.

**Correction dans `MissionForm.tsx` :**
```ts
// ✅ Toujours assigner updatedAt à la sauvegarde
const newMission: Mission = {
  id: initialData ? initialData.id : crypto.randomUUID(),
  title,
  client,
  location,
  description,
  startTime: startIso,
  endTime: endIso,
  updatedAt: new Date().toISOString(),  // ← CRITIQUE : toujours renseigner
  status,
  rateType: finalRateType,
  hourlyRate: calculationMode === 'auto' ? prefDayRate : 0,
  totalEarnings: finalTotal,
  details: { dayHours, nightHours },
  isPaid: initialData?.isPaid ?? false,
  paymentId: initialData?.paymentId,   // ← préserver l'état de paiement
};
```

---

### P6 — Dépendances manquantes dans le `useEffect` de `MissionForm` ⚠️ MOYEN

**Fichier :** `src/components/MissionForm.tsx`

**Code problématique :**
```ts
// ❌ prefDayRate et prefNightRate manquent dans les dépendances
useEffect(() => {
  const result = calculateEarningsMultiple(date, timeSlots, prefDayRate, prefNightRate);
  setComputedTotal(result.total);
}, [timeSlots, date, calculationMode]); // ← manque prefDayRate, prefNightRate
```

**Correction :**
```ts
// ✅ Dépendances complètes
useEffect(() => {
  if (calculationMode !== 'auto' || timeSlots.length === 0 || !date) return;
  const result = calculateEarningsMultiple(date, timeSlots, prefDayRate, prefNightRate);
  setDayHours(result.dayHours);
  setNightHours(result.nightHours);
  setComputedTotal(result.total);
}, [timeSlots, date, calculationMode, prefDayRate, prefNightRate]); // ✅
```

---

### P7 — Création d'objectifs par défaut non idempotente ⚠️ MOYEN-ÉLEVÉ

**Fichier :** `src/components/DashboardGoals.tsx`

**Description :** Au montage, si aucun objectif n'est trouvé, le composant génère deux UUIDs aléatoires et appelle `saveGoalsToSupabase`. Sous React StrictMode (montage/démontage/remontage), ou sur deux onglets, cela peut créer des doublons.

**Correction côté service (`goalsService.ts`) :**
```ts
// ✅ Idempotent grâce à ignoreDuplicates: true sur la contrainte unique
export const ensureDefaultGoals = async (): Promise<Goal[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase non configuré');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const defaults = [
    { user_id: user.id, type: 'revenue' as const, target: 5000, period: 'month' as const },
    { user_id: user.id, type: 'missions' as const, target: 10, period: 'month' as const },
  ];

  // ignoreDuplicates: true => pas de double création même si appelé plusieurs fois
  const { error } = await supabase
    .from('goals')
    .upsert(defaults, { onConflict: 'user_id,type,period', ignoreDuplicates: true });

  if (error) throw error;
  return loadGoalsFromSupabase();
};
```

**Dans `DashboardGoals.tsx`, remplacer l'initialisation locale :**
```ts
// ✅ Appeler ensureDefaultGoals() au lieu de créer localement
useEffect(() => {
  ensureDefaultGoals().then(setGoals).catch(console.error);
}, [user?.id]); // dépendance sur user.id, pas sur un tableau vide
```

---

### P10 — Paiements non transactionnels ⚠️ ÉLEVÉ

**Fichier :** `src/services/supabaseService.ts`

**Description :** L'enregistrement d'un paiement effectue deux requêtes séparées : upsert du paiement, puis update des missions. Si la seconde échoue, le paiement existe mais les missions ne sont pas marquées payées.

**Correction via RPC PostgreSQL (à créer dans Supabase SQL Editor) :**
```sql
-- ✅ Transaction atomique : tout ou rien
CREATE OR REPLACE FUNCTION save_payment_with_missions(
  p_payment_id    UUID,
  p_user_id       UUID,
  p_date          DATE,
  p_amount        NUMERIC,
  p_client        TEXT,
  p_description   TEXT,
  p_reference     TEXT,
  p_mission_ids   UUID[],
  p_method        TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Vérifier que l'appelant est bien le propriétaire
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  INSERT INTO payments (id, user_id, date, amount, client, description, reference, mission_ids, method)
  VALUES (p_payment_id, p_user_id, p_date, p_amount, p_client, p_description, p_reference, p_mission_ids, p_method)
  ON CONFLICT (id) DO UPDATE SET
    amount = EXCLUDED.amount,
    description = EXCLUDED.description,
    updated_at = now();

  UPDATE missions
  SET payment_id = p_payment_id, is_paid = true, updated_at = now()
  WHERE user_id = p_user_id
    AND id = ANY(p_mission_ids);
END;
$$;
```

**Appel TypeScript :**
```ts
// ✅ Une seule requête transactionnelle
const { error } = await supabase.rpc('save_payment_with_missions', {
  p_payment_id: payment.id,
  p_user_id: userId,
  p_date: payment.date,
  p_amount: payment.amount,
  p_client: payment.client,
  p_description: payment.description ?? '',
  p_reference: payment.reference ?? '',
  p_mission_ids: payment.missionIds,
  p_method: payment.method,
});
if (error) throw error;
```

---

### P11 — Bootstrap Auth non déterministe ⚠️ MOYEN

**Fichier :** `src/context/AuthContext.tsx`

**Description :** `getCurrentUser()` et `onAuthStateChange()` peuvent écrire `user` dans un ordre non prévisible au montage. Sous StrictMode, cela peut vider momentanément l'état.

**Correction :**
```ts
// ✅ Pattern recommandé par Supabase : getSession() comme bootstrap unique
useEffect(() => {
  let cancelled = false;

  supabase.auth.getSession().then(({ data }) => {
    if (cancelled) return;
    setUser(toAuthUser(data.session?.user ?? null));
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(toAuthUser(session?.user ?? null));
    setLoading(false);
    // Nettoyer le cache local au logout
    if (!session) {
      clearLegacyStorage();
    }
  });

  return () => {
    cancelled = true;
    subscription.unsubscribe();
  };
}, []);
```

---

### P12 — Erreurs Supabase silencieuses ⚠️ ÉLEVÉ

**Description :** Plusieurs fonctions retournent `[]` en cas d'erreur. L'UI ne distingue pas "aucune donnée" de "erreur de chargement", ce qui peut déclencher des sauvegardes destructives sur un état vide.

**Correction — typer les résultats :**
```ts
// ✅ Type Result<T> pour distinguer erreur vs données vides
type LoadResult<T> = { ok: true; data: T } | { ok: false; error: PostgrestError | Error };

export const loadMissionsFromSupabase = async (): Promise<LoadResult<Mission[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: new Error('Supabase non configuré') };

  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('start_time', { ascending: false });

  if (error) return { ok: false, error };
  return { ok: true, data: (data ?? []).map(dbToMission) };
};

// Dans MissionContext :
const result = await loadMissionsFromSupabase();
if (!result.ok) {
  setError(result.error.message); // afficher l'erreur à l'utilisateur
  return; // NE PAS écraser les données locales avec un tableau vide
}
setMissions(result.data);
```

---

## 📋 PROBLÈMES MOYENS

---

### P13 — Calculs de dates sans timezone IANA ⚠️ MOYEN-ÉLEVÉ

**Description :** Les calculs utilisent `new Date('YYYY-MM-DDTHH:mm')` en timezone locale. Des devices dans deux fuseaux différents calculeront des revenus différents pour la même mission. Les transitions DST (dernier dimanche de mars/octobre) peuvent ajouter/enlever une heure.

**Recommandation à court terme :**
```ts
// ✅ Sauvegarder le snapshot financier validé — ne pas recalculer depuis l'historique
const newMission: Mission = {
  ...otherFields,
  totalEarnings: computedTotal,  // snapshot au moment de la validation
  details: { dayHours, nightHours }, // snapshot validé
  // Ne pas recalculer ces valeurs à l'affichage avec les préférences courantes
};
```

**Recommandation à moyen terme :**
```ts
// ✅ Stocker le fuseau horaire avec la mission
interface Mission {
  // ...
  timezone: string;     // 'Europe/Paris' — IANA timezone name
  missionDate: string;  // 'YYYY-MM-DD' — date locale de la mission
  startLocalTime: string; // 'HH:mm' — heure locale
  endLocalTime: string;   // 'HH:mm' — heure locale
  totalEarnings: number;  // snapshot — ne pas recalculer
}
```

---

### P14 — Tris in-place sur des tableaux React ⚠️ FAIBLE-MOYEN

**Description :** Certains `useMemo` trient des tableaux sans copie préalable, ce qui peut muter l'état React de manière inattendue si le code est refactoré.

**Correction systématique :**
```ts
// ❌ Mutation potentielle
const sorted = missions.sort((a, b) => ...);

// ✅ Toujours copier avant de trier
const recentMissions = useMemo(() =>
  [...missions]
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    .slice(0, 5),
  [missions]
);
```

---

### P15 — Context Provider monolithique sans memoization ⚠️ MOYEN

**Fichier :** `src/context/MissionContext.tsx`

**Description :** Le Provider recrée l'objet `value` à chaque render, forçant tous les consommateurs à re-rendre. Le context mélange missions, paiements, auth, sync — responsabilité excessive.

**Correction immédiate :**
```ts
// ✅ Mémoïser la valeur du Provider
const contextValue = useMemo(() => ({
  missions,
  payments,
  isLoading,
  addMission,
  updateMission,
  deleteMission,
  // ...
}), [missions, payments, isLoading]); // dépendances précises

return (
  <MissionContext.Provider value={contextValue}>
    {children}
  </MissionContext.Provider>
);
```

**Recommandation moyen terme :** Séparer en `MissionQueryContext` + `MissionMutationContext` + `PaymentContext`.

---

## 🔐 AUDIT SÉCURITÉ COMPLET

| Risque | Gravité | Statut |
|---|:---:|---|
| Policy RLS publique sur missions | ❌ Critique | À corriger immédiatement |
| API Key Gemini exposée côté frontend | ❌ Critique | Migrer vers Supabase Edge Function |
| Données Supabase dans Cache Storage (SW) | ❌ Élevé | Supprimer le cache Workbox Supabase |
| localStorage non partitionné par user | ❌ Élevé | Scoper les clés par userId |
| `user_id` nullable dans DB | ⚠️ Élevé | ALTER TABLE SET NOT NULL |
| Pas de FK missions.payment_id → payments.id | ⚠️ Élevé | Ajouter migration |
| Pas de validation serveur des montants | ⚠️ Élevé | Ajouter CHECK constraints |
| Gemini key dans `define` Vite (frontend) | ❌ Critique | Voir ci-dessous |

**Migration Gemini vers Edge Function :**
```ts
// ❌ AVANT : clé exposée au navigateur
// define: { 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) }

// ✅ APRÈS : appel via Edge Function Supabase
export const enhanceDescription = async (rawText: string, context: MissionContext): Promise<string> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('enhance-description', {
    body: { rawText, context }
  });
  if (error) throw error;
  return data.result;
};
```

```ts
// Supabase Edge Function : supabase/functions/enhance-description/index.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

Deno.serve(async (req) => {
  const { rawText, context } = await req.json();
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(`...prompt...${rawText}`);
  return new Response(JSON.stringify({ result: result.response.text() }));
});
```

---

## 🏗️ ARCHITECTURE CIBLE RECOMMANDÉE

```
src/
  domains/
    auth/
      auth.context.tsx      ← AuthProvider avec getSession() + listener
      auth.service.ts
    missions/
      mission.api.ts        ← mutations unitaires (create/update/delete)
      mission.cache.ts      ← IndexedDB par userId
      mission.realtime.ts   ← subscription postgres_changes + cleanup
      mission.context.tsx   ← Provider memoïsé, séparé query/mutation
    payments/
      payment.api.ts        ← RPC transactionnelle
      payment.realtime.ts
    goals/
      goals.api.ts          ← ensureDefaultGoals() idempotent
    preferences/
  infrastructure/
    supabase.ts             ← singleton client
    indexeddb.ts            ← stores: entities, mutation_queue, sync_meta
    telemetry.ts            ← Sentry ou équivalent
  components/
```

**Principes :**
- Supabase = source de vérité online
- IndexedDB = cache durable + queue offline (remplacer localStorage)
- React Context = orchestration légère, pas base de données
- Mutations explicites, jamais snapshot implicite
- Realtime pour convergence online
- RPC pour opérations multi-tables

---

## ✅ CHECKLIST DE CORRECTION PAR PRIORITÉ

### 🔴 IMMÉDIAT — Avant tout déploiement

- [ ] **P3** — Supprimer le cache Workbox Supabase dans `vite.config.ts`
- [ ] **P8** — `DROP POLICY "Public can view completed missions"` en DB
- [ ] **P1** — Désactiver l'autosave snapshot dans `MissionContext` (commenter `idsToDelete`)
- [ ] **P2** — Partitionner les clés localStorage par `userId`
- [ ] **P9** — Exécuter la migration `payments` + `payment_id` + RLS
- [ ] **P12** — Faire remonter les erreurs Supabase à l'UI (ne plus retourner `[]`)

### 🟠 SPRINT SUIVANT

- [ ] **P1** — Implémenter `saveMissionMutation` + rollback optimiste
- [ ] **P4** — Ajouter subscriptions realtime avec cleanup
- [ ] **P5** — Assigner `updatedAt: new Date().toISOString()` dans `MissionForm`
- [ ] **P6** — Corriger les dépendances du `useEffect` dans `MissionForm`
- [ ] **P7** — Remplacer l'init d'objectifs par `ensureDefaultGoals()` idempotent
- [ ] **P10** — Créer la RPC `save_payment_with_missions`
- [ ] **P11** — Refactorer `AuthContext` avec `getSession()` + garde d'annulation
- [ ] **P15** — Mémoïser la valeur du Provider

### 🟡 MOYEN TERME

- [ ] **P13** — Ajouter `timezone` IANA sur les missions + snapshot financier
- [ ] **Gemini** — Migrer vers Supabase Edge Function
- [ ] **Offline** — IndexedDB + mutation queue + tombstones
- [ ] **Tests** — DST/timezone, StrictMode, multi-device, concurrence
- [ ] **Observabilité** — Sentry, logs structurés de sync

### 🟢 PEUT ATTENDRE

- [ ] Refactor architecture par domaines
- [ ] Virtualisation des listes longues
- [ ] Chunk `charts-vendor` pour Recharts
- [ ] Mode thème clair

---

## 📝 NOTES FINALES

Le cœur du problème est l'absence d'un modèle clair de synchronisation. Le code est lisible et fonctionnel pour un usage mono-device, mais les patterns actuels (snapshot destructif, localStorage global, cache SW des APIs) rendent la cohérence multi-device impossible à garantir.

Les 6 corrections immédiates éliminent les risques de perte de données. Les corrections du sprint suivant établissent une architecture fiable. Les corrections moyen terme complètent le système pour une production robuste.

---

*Audit réalisé le 29 mai 2026 — NeuroTime v2.0*
