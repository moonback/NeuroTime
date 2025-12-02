# Configuration Supabase pour NeuroTime

Ce guide vous explique comment configurer Supabase pour sauvegarder vos missions.

## Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Créez un nouveau projet ou utilisez un projet existant
3. Notez l'URL de votre projet et la clé anonyme (anon key)

### 2. Créer la table missions

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Copiez le contenu du fichier `supabase_setup.sql`
3. Collez-le dans l'éditeur SQL et exécutez-le
4. Vérifiez que la table `missions` a été créée dans **Table Editor**

**Note pour les bases existantes :** Si vous avez déjà une table `missions`, exécutez également le script `supabase_migration_time_slots.sql` pour ajouter le support des créneaux horaires multiples.

### 3. Activer RLS (Row Level Security)

Le script SQL active RLS et crée des politiques de sécurité qui permettent à chaque utilisateur de voir uniquement ses propres missions. Cela garantit que :
- Chaque utilisateur ne peut accéder qu'à ses propres données
- Les missions sont automatiquement filtrées par `user_id`
- La sécurité est assurée même si plusieurs utilisateurs utilisent l'application

### 4. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Clé API Gemini
GEMINI_API_KEY=votre_cle_gemini_ici

# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

**Où trouver ces valeurs :**
- `VITE_SUPABASE_URL` : Dans votre projet Supabase, allez dans **Settings > API > Project URL**
- `VITE_SUPABASE_ANON_KEY` : Dans **Settings > API > Project API keys > anon public**

### 5. Redémarrer l'application

Après avoir configuré les variables d'environnement, redémarrez l'application :

```bash
npm run dev
```

## Fonctionnement

- **Sauvegarde automatique** : Toutes les modifications de missions sont automatiquement sauvegardées dans Supabase
- **Fallback localStorage** : Si Supabase n'est pas disponible, l'application utilise localStorage comme sauvegarde de secours
- **Synchronisation** : Au démarrage, l'application charge les données depuis Supabase, et synchronise avec localStorage

## Sécurité

⚠️ **Important** : Comme RLS est désactivé, votre clé API anonyme donne accès complet à la table `missions`. Assurez-vous de :
- Ne jamais partager votre fichier `.env.local`
- Ne jamais commiter `.env.local` dans Git (il est déjà dans `.gitignore`)
- Utiliser uniquement la clé **anon** (publique), jamais la clé **service_role** (privée)

## Dépannage

### Les données ne se sauvegardent pas

1. Vérifiez que les variables d'environnement sont correctement définies dans `.env.local`
2. Vérifiez que la table `missions` existe dans Supabase
3. Ouvrez la console du navigateur pour voir les erreurs éventuelles
4. Vérifiez que RLS est bien désactivé sur la table

### Erreur de connexion

1. Vérifiez que l'URL Supabase est correcte (doit commencer par `https://`)
2. Vérifiez que la clé anonyme est correcte
3. Vérifiez votre connexion internet

