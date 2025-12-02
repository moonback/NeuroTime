# Configuration des Objectifs en Base de Données

Les objectifs sont maintenant sauvegardés dans Supabase au lieu de localStorage, permettant une synchronisation multi-appareils.

## Installation

### 1. Exécuter le script SQL

Exécutez le script `supabase_setup_goals.sql` dans l'éditeur SQL de votre projet Supabase :

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu de `supabase_setup_goals.sql`
5. Exécutez le script

### 2. Vérification

Après l'exécution, vous devriez avoir :
- Une table `goals` créée
- Les politiques RLS (Row Level Security) activées
- Les index créés pour optimiser les performances

## Structure de la table

```sql
goals
├── id (UUID, PRIMARY KEY)
├── user_id (UUID, FOREIGN KEY → auth.users)
├── type (TEXT: 'revenue' | 'missions' | 'hours')
├── target (NUMERIC: valeur cible)
├── period (TEXT: 'month' | 'year')
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## Fonctionnalités

- **Synchronisation automatique** : Les objectifs sont sauvegardés automatiquement dans Supabase
- **Sécurité** : Chaque utilisateur ne peut voir/modifier que ses propres objectifs (RLS)
- **Multi-appareils** : Les objectifs sont synchronisés entre tous vos appareils
- **Performance** : Index optimisés pour des requêtes rapides

## Migration depuis localStorage

Si vous aviez des objectifs dans localStorage, ils seront automatiquement remplacés par ceux de Supabase lors de la première connexion.

## API du service

Le service `goalsService.ts` fournit les fonctions suivantes :

- `loadGoalsFromSupabase()` : Charger tous les objectifs de l'utilisateur
- `saveGoalToSupabase(goal)` : Sauvegarder un objectif (créer ou mettre à jour)
- `deleteGoalFromSupabase(goalId)` : Supprimer un objectif
- `saveGoalsToSupabase(goals)` : Sauvegarder plusieurs objectifs (synchronisation)

