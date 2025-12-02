# 🧠 NeuroTime

**Application de gestion personnelle pour freelances événementiels** — Suivez vos missions, calculez automatiquement vos gains avec tarifs jour/nuit, et gérez votre activité avec une interface moderne et intuitive.

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Stack technique](#-stack-technique)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)
- [Variables d'environnement](#-variables-denvironnement)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## 🎯 Présentation

NeuroTime est une application web moderne conçue pour les freelances du secteur événementiel (techniciens, régisseurs, hôtes d'accueil). Elle permet de gérer efficacement vos missions, de calculer automatiquement vos gains selon les tarifs jour/nuit, et d'analyser votre activité avec des statistiques détaillées.

**Pitch** : Simplifiez la gestion de vos missions événementielles avec un outil qui calcule automatiquement vos gains, organise votre planning et vous donne des insights sur votre activité grâce à l'intelligence artificielle.

---

## 🛠️ Stack technique

### Frontend
- **React 19.2.0** — Bibliothèque UI moderne
- **TypeScript 5.8.2** — Typage statique
- **Vite 6.2.0** — Build tool et dev server
- **Tailwind CSS 4.1.17** — Framework CSS utilitaire
- **date-fns 4.1.0** — Manipulation de dates
- **lucide-react 0.555.0** — Icônes modernes

### Backend & Services
- **Supabase** — Base de données PostgreSQL avec authentification
- **Google Gemini AI** — Intelligence artificielle pour l'analyse d'images et l'amélioration de descriptions

### Outils de développement
- **PostCSS** — Traitement CSS
- **Autoprefixer** — Préfixes CSS automatiques

---

## ✨ Fonctionnalités

### MVP (Minimum Viable Product)

#### 📊 Tableau de bord
- Vue d'ensemble de l'activité avec statistiques clés
- Chiffre d'affaires total (missions terminées + prévisionnel)
- Nombre d'heures travaillées
- Résumé intelligent généré par IA
- Export CSV des données
- Sauvegarde/Restauration des données (JSON)

#### 📅 Gestion des missions
- **Création/Édition** : Formulaire complet avec validation
- **Statuts** : Planifié, Terminé, Annulé
- **Calcul automatique** : Tarifs jour (20€/h) et nuit (25€/h)
- **Détails** : Client, lieu, description, horaires
- **Logistique** : Horaires de livraison/récupération (optionnel)

#### 📆 Vues multiples
- **Tableau de bord** : Statistiques et missions à venir
- **Liste des missions** : Vue tabulaire avec filtres et recherche
- **Agenda** : Vue calendrier mensuelle interactive

#### 🤖 Intelligence artificielle
- **Scanner d'images** : Import automatique de plannings depuis photos
- **Amélioration de descriptions** : Réécriture professionnelle des notes
- **Résumé intelligent** : Analyse de l'activité avec recommandations

#### 🔐 Authentification
- Connexion/Inscription via Supabase Auth
- Séparation des données par utilisateur (RLS)
- Gestion de session persistante

#### 💾 Persistance des données
- Sauvegarde automatique dans Supabase
- Fallback sur localStorage en cas d'indisponibilité
- Synchronisation automatique

---

## 📦 Prérequis

- **Node.js** ≥ 18.0.0 (recommandé : LTS)
- **npm** ≥ 9.0.0 (ou **yarn** / **pnpm**)
- Un compte **Supabase** (gratuit)
- Une clé API **Google Gemini** (gratuite)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/NeuroTime.git
cd NeuroTime
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

1. Créer un projet sur [Supabase](https://app.supabase.com)
2. Dans l'éditeur SQL, exécuter le script `supabase_setup.sql`
3. Vérifier que la table `missions` a été créée

### 4. Configurer les variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# Clé API Google Gemini
GEMINI_API_KEY=votre_cle_gemini_ici

# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

**Où trouver ces valeurs :**
- **GEMINI_API_KEY** : [Google AI Studio](https://aistudio.google.com/app/apikey)
- **VITE_SUPABASE_URL** : Settings > API > Project URL
- **VITE_SUPABASE_ANON_KEY** : Settings > API > Project API keys > anon public

---

## ⚙️ Configuration

### Configuration Supabase

Le script `supabase_setup.sql` configure automatiquement :
- La table `missions` avec tous les champs nécessaires
- **Row Level Security (RLS)** activé
- Politiques de sécurité par utilisateur
- Index pour optimiser les performances
- Trigger pour `updated_at` automatique

### Configuration des tarifs

Les tarifs par défaut sont définis dans `utils/calculations.ts` :
- **Jour** : 20€/h (7h - 22h)
- **Nuit** : 25€/h (22h - 7h)

Pour modifier ces valeurs, éditez les constantes :
```typescript
export const RATE_DAY = 20;
export const RATE_NIGHT = 25;
```

---

## 🏃 Lancement

### Mode développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build de production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`

### Prévisualisation du build

```bash
npm run preview
```

---

## 📁 Structure du projet

```
NeuroTime/
├── components/              # Composants React
│   ├── AuthModal.tsx       # Modal d'authentification
│   ├── CalendarView.tsx     # Vue calendrier
│   ├── Dashboard.tsx        # Tableau de bord
│   ├── ImageImportModal.tsx # Import d'images IA
│   ├── MissionForm.tsx     # Formulaire de mission
│   └── MissionsList.tsx     # Liste des missions
├── services/                # Services métier
│   ├── authService.ts       # Authentification Supabase
│   ├── geminiService.ts     # Intégration Gemini AI
│   ├── storageService.ts    # Gestion du stockage
│   └── supabaseService.ts   # Client Supabase
├── utils/                   # Utilitaires
│   └── calculations.ts      # Calculs tarifaires
├── App.tsx                  # Composant racine
├── index.tsx                # Point d'entrée
├── index.html               # Template HTML
├── index.css                # Styles globaux
├── types.ts                 # Types TypeScript
├── vite.config.ts           # Configuration Vite
├── tailwind.config.js       # Configuration Tailwind
├── tsconfig.json            # Configuration TypeScript
├── postcss.config.js        # Configuration PostCSS
├── supabase_setup.sql       # Script SQL Supabase
├── package.json             # Dépendances
└── README.md                # Documentation
```

---

## 🔐 Variables d'environnement

| Variable | Description | Requis | Exemple |
|----------|-------------|--------|---------|
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ Oui | `AIzaSy...` |
| `VITE_SUPABASE_URL` | URL du projet Supabase | ✅ Oui | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ Oui | `eyJhbGc...` |

⚠️ **Important** : Ne jamais commiter le fichier `.env.local` dans Git (déjà dans `.gitignore`)

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le projet
2. Créer une **branche** pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une **Pull Request**

### Bonnes pratiques

- Suivre les conventions de code TypeScript/React
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter les changements majeurs
- Respecter la structure de dossiers existante
- Utiliser des messages de commit clairs et descriptifs

### Format de commit

```
type(scope): description

Exemples:
feat(dashboard): add earnings chart
fix(calculations): correct night rate calculation
docs(readme): update installation steps
```

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

---

## 🔗 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Google Gemini](https://ai.google.dev/docs)
- [Documentation React](https://react.dev)
- [Documentation Vite](https://vitejs.dev)
- [Documentation Tailwind CSS](https://tailwindcss.com)

---

## 📞 Support

Pour toute question ou problème :
- Ouvrir une [issue](https://github.com/votre-username/NeuroTime/issues)
- Consulter la [documentation Supabase](SUPABASE_SETUP.md)

---

<div align="center">
  <p>Fait avec ❤️ pour les freelances événementiels</p>
</div>
