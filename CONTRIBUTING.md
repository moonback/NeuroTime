# Guide de contribution — NeuroTime

Merci de contribuer à NeuroTime. Ce guide décrit le workflow recommandé pour modifier l'application de manière sûre, testable et cohérente.

---

## Prérequis pour contribuer

| Prérequis | Version / accès recommandé | Notes |
|---|---:|---|
| Node.js | 22.x LTS | Recommandé avec les dépendances actuelles. |
| npm | 10.x | Utiliser `npm install` pour respecter `package-lock.json`. |
| Git | 2.40+ | Branches et Pull Requests. |
| Supabase | Projet de dev dédié | Ne pas tester sur la base de production. |
| Supabase CLI | Dernière version stable | Pour migrations et Edge Functions. |
| Navigateur moderne | Chrome, Edge, Firefox ou Safari récent | Tester la PWA et le responsive. |

---

## Installation locale

```bash
git clone <url-du-repot>
cd NeuroTime
npm install
```

Créer `.env.local` :

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

> ⚠️ À compléter : ajouter un fichier `.env.example` versionné pour éviter les erreurs d'onboarding.

---

## Workflow Git

### Branches

Utiliser des branches courtes et explicites :

| Type | Format | Exemple |
|---|---|---|
| Feature | `feat/<sujet>` | `feat/payment-filters` |
| Fix | `fix/<sujet>` | `fix/mission-overlap-validation` |
| Docs | `docs/<sujet>` | `docs/api-reference` |
| Refactor | `refactor/<sujet>` | `refactor/storage-service` |
| Chore | `chore/<sujet>` | `chore/update-deps` |

### Commits

Respecter Conventional Commits :

```text
<type>(<scope>): <description courte>
```

Exemples :

```text
feat(payments): add grouped transfer creation
fix(missions): prevent invalid time ranges
docs(readme): document Supabase setup
test(calculations): cover mixed day night rates
```

Types recommandés :

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité utilisateur. |
| `fix` | Correction de bug. |
| `docs` | Documentation uniquement. |
| `style` | Formatage sans changement logique. |
| `refactor` | Restructuration sans changement fonctionnel. |
| `test` | Ajout ou correction de tests. |
| `chore` | Maintenance, tooling, dépendances. |

### Pull Request

Chaque PR doit inclure :

- une description claire du problème et de la solution ;
- les captures d'écran si l'interface change ;
- les commandes de test exécutées ;
- les impacts Supabase : migrations, RLS, RPC, Edge Functions ;
- les risques de compatibilité avec les données existantes.

---

## Standards de code

### TypeScript / React

- Utiliser TypeScript pour tout nouveau code applicatif.
- Préférer des composants fonctionnels React.
- Garder la logique métier pure dans `src/utils/` quand elle est testable.
- Isoler les effets réseau dans `src/services/`.
- Ne pas exposer de secret côté frontend ; seules les variables `VITE_*` sont publiques.
- Ne jamais entourer les imports avec des blocs `try/catch`.
- Utiliser `useMemo` et `useCallback` uniquement quand ils réduisent un coût réel ou stabilisent une dépendance.
- Maintenir les types métier dans `src/types.ts` ou dans le service propriétaire du domaine.

### Supabase

- Ajouter ou modifier les colonnes via migration SQL versionnée.
- Activer RLS sur toute table contenant des données utilisateur.
- Ajouter des politiques qui vérifient `auth.uid() = user_id`.
- Ajouter des index pour les filtres fréquents : `user_id`, dates, statuts, relations.
- Utiliser une RPC pour les opérations multi-table atomiques.
- Tester les migrations sur une base de développement avant toute mise en production.

### CSS / UI

- Respecter les variables CSS et conventions visuelles existantes.
- Préserver le responsive mobile et desktop.
- Ajouter des labels accessibles aux boutons icon-only.
- Conserver les états loading, empty et error lorsque l'action peut échouer.

### Documentation

- Mettre à jour `README.md` pour tout changement d'installation, configuration ou lancement.
- Mettre à jour `API_DOCS.md` pour tout nouveau service Supabase, RPC ou Edge Function.
- Mettre à jour `DB_SCHEMA.md` pour toute modification SQL.
- Mettre à jour `ARCHITECTURE.md` si un flux ou une décision d'architecture change.
- Indiquer `> ⚠️ À compléter : ...` quand une information requise manque.

---

## Comment lancer les tests

### Tests unitaires

```bash
npm test
```

### Build de production

```bash
npm run build
```

### Preview locale

```bash
npm run preview
```

### Vérifications recommandées avant PR

```bash
npm test
npm run build
```

> ⚠️ À compléter : aucun script `lint` n'est défini dans `package.json`. Ajouter ESLint/Prettier si un contrôle de style automatisé est souhaité.

---

## Processus de review

1. Ouvrir une PR depuis une branche dédiée.
2. Vérifier que les tests et le build passent.
3. Décrire les migrations Supabase nécessaires, s'il y en a.
4. Demander une review à un mainteneur.
5. Traiter les commentaires par commits additionnels ou amend si demandé.
6. Squash ou merge selon la convention du dépôt.
7. Surveiller le déploiement et les erreurs après merge.

Critères d'acceptation :

- comportement conforme à la demande ;
- absence de secret dans le bundle frontend ;
- types TypeScript cohérents ;
- RLS préservée ;
- tests ajoutés ou justification si non pertinent ;
- documentation synchronisée avec le changement.

---

## Code de conduite

- Rester respectueux, factuel et constructif.
- Critiquer le code, jamais les personnes.
- Expliquer les décisions techniques importantes.
- Refuser les contributions qui dégradent la sécurité des données utilisateur.
- Favoriser des changements petits, relisibles et testables.
