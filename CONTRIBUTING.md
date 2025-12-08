## Contribuer à NeuroTime

### Préparer l’environnement
1) Node 18+, npm install.  
2) Copier `.env.local` depuis l’exemple et renseigner `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.  
3) Appliquer les scripts SQL Supabase nécessaires (`supabase_setup.sql`, migrations clients/goals) si vous utilisez une base vierge.

### Branches & commits
- Branche de feature : `feature/<sujet>` ; correctif : `fix/<sujet>`.
- Convention de commit : `type(scope): message` (ex. `feat(auth): improve session handling`).
- Un commit par changement cohérent (UI, service, migration…).

### Style de code
- TypeScript, composants fonctionnels React, hooks idiomatiques (`useState`, `useEffect`, `useMemo`, `useCallback`).
- Styling via Tailwind utilitaire existant ; réutiliser les classes “glass” et variantes pour cohérence visuelle.
- Logique métier dans `services/`, pas dans les composants. Synchronisation Supabase + fallback localStorage conservée.
- Conversions camelCase ↔ snake_case centralisées dans `supabaseService.ts` / `goalsService.ts`.

### Tests et vérifications manuelles
- Lancer l’app : `npm run dev`; build : `npm run build`; preview : `npm run preview`.
- Parcours manuel minimal avant PR :  
  - Auth (sign in/out).  
  - Créer/éditer une mission avec multi-créneaux, vérifier calcul auto.  
  - Export CSV/JSON sur le dashboard; basculer offline (désactiver réseau) puis revenir online, vérifier la synchro.  
  - Tester le prompt PWA (desktop ou mobile).

### Ouverture de PR
- Décrire le problème, la solution et l’impact (UI, DB, perf, sécurité).
- Mentionner les migrations SQL à appliquer.
- Joindre des captures si l’UI change.

### Sécurité & données
- Ne jamais commiter `.env.local` ni de clés privées. Utiliser uniquement la clé Supabase `anon`.
- Respecter le RLS : requêtes toujours filtrées par utilisateur (déjà géré par les services).
- Nettoyer les erreurs utilisateurs (messages clairs) et logguer les erreurs techniques en console.

### Où contribuer en priorité
- Robustesse offline/online (retries, file d’attente).
- Accessibilité et UX (focus, clavier, feedback).
- Couverture tests (E2E préférés).
- Observabilité (Sentry/LogRocket) et validation métier (cohérence heures/CA).

