# Analyse Complète du Projet NeuroTime

## 1. Architecture et Structure du Code

**Diagnostic :**
L'architecture actuelle présente une **dette structurelle majeure**. Les fichiers sources (`App.tsx`, `components/`, `services/`) sont mélangés à la racine du projet, alors qu'un dossier `src/` existe aussi. C'est non-standard pour un projet Vite/React et rend la maintenance difficile.

*   **Problème critique** : Mélange de fichiers à la racine et dans `src/`.
*   **Routing manuel** : Vous utilisez un `useState('dashboard')` pour la navigation. Cela casse l'historique du navigateur (bouton retour) et empêche le partage de liens directs (ex: `/missions/123`).

**Recommandations :**

| Priorité | Action | Difficulté | Pourquoi ? |
| :--- | :--- | :--- | :--- |
| 1 | **Standardisation `src/`** | 🟢 Facile | Déplacer `components`, `services`, `hooks`, `types`, `utils`, `App.tsx` et `index.css` DANS le dossier `src/`. La racine ne doit contenir que la config (`vite.config.ts`, `package.json`, etc.). |
| 2 | **Adopter React Router** | 🟡 Moyen | Remplacer le `useState<ViewState>` par `react-router-dom`. Cela active l'historique natif et les URLs profondes. |
| 3 | **Architecture "Feature-first"** | 🟡 Moyen | Au lieu de `components/` vs `services/`, regroupez par domaine : `features/missions`, `features/finance`, `features/auth`. |

**Exemple de structure cible :**
```text
src/
  ├── assets/
  ├── components/ (ui partagée : Button, Modal, Card)
  ├── features/
  │   ├── missions/ (components + hooks + services dédiés)
  │   ├── finance/
  │   └── dashboard/
  ├── layouts/ (MainLayout avec Sidebar)
  ├── context/ (AuthContext, MissionContext)
  ├── services/ (API clients : supabase, openai)
  ├── App.tsx
  └── main.tsx
```

---

## 2. Qualité du Code

**Diagnostic :**
*   **App.tsx monolithique** : `App.tsx` fait plus de 500 lignes. Il gère l'auth, le chargement des données, le routing, les modales et l'état global. C'est trop.
*   **Prop Drilling** : L'état `missions` est passé manuellement de `App` -> `Dashboard` -> `DashboardKPIs`.
*   **Usage de `any`** : Présent dans `supabaseService.ts` (`const dbRow: any`). Cela annule les bénéfices de TypeScript.

**Recommandations :**

| Priorité | Action | Difficulté | Pourquoi ? |
| :--- | :--- | :--- | :--- |
| 1 | **Extraire les Contextes** | 🟡 Moyen | Créer `MissionContext` et `AuthContext` pour ne plus passer les props manuellement partout. |
| 2 | **Typage Strict** | 🟢 Facile | Remplacer `any` par `Database['public']['Tables']['missions']['Row']` (généré via Supabase CLI) ou un type partiel explicite. |
| 3 | **Custom Hooks** | 🟢 Facile | Extraire la logique de `App.tsx` dans `useMissionData()` et `useAuthLogic()`. |

---

## 3. Gestion de l'état

**Diagnostic :**
Actuellement : `useState` dans `App.tsx` + `useEffect` pour la synchronisation.
C'est fonctionnel mais fragile pour une app "Offline First". Si deux composants modifient une mission, la synchro peut être complexe.

**Recommandations :**

1.  **React Query (TanStack Query)** : C'est le standard industriel pour gérer l'état serveur (Supabase). Il gère le cache, le refetch en background (reconnexion internet) et les états de chargement nativement.
    *   *Alternative légère* : Garder votre structure actuelle mais déplacer la logique dans un `MissionProvider` qui expose `{ missions, addMission, updateMission }`.

2.  **Zustand** (Optionnel) : Si vous avez besoin d'état global UI complexe (ex: état du calendrier, filtres actifs, sidebar) qui n'est pas lié à la base de données.

---

## 4. Expérience Utilisateur (UX)

**Points forts** : PWA installable, mode sombre (neo-aurora), indicateurs de chargement.

**Points de friction identifiés :**
*   **Navigation** : Le bouton "Précédent" du navigateur fait quitter l'app au lieu de changer de vue.
*   **Sauvegarde** : Le "Debounce" de 500ms dans `App.tsx` est bien, mais l'utilisateur ne sait pas toujours si c'est sauvegardé (le petit indicateur est discret).
*   **Feedback** : Les `alert()` et `window.confirm()` (lignes 146, 159, 188) bloquent l'interface et font "vieillot".

**Recommandations :**

| Priorité | Action | Difficulté | Pourquoi ? |
| :--- | :--- | :--- | :--- |
| 1 | **Toasts Notifications** | 🟢 Facile | Remplacer `alert()` par `sonner` ou `react-hot-toast` pour des notifications non-bloquantes et esthétiques. |
| 2 | **Modales natives** | 🟡 Moyen | Remplacer `window.confirm` par votre composant `AuthModal` réutilisé ou une nouvelle `ConfirmModal` stylisée. |
| 3 | **Skeleton Loading** | 🟢 Facile | Remplacer le `LoadingSpinner` plein écran par des "Skeletons" (fausses cartes grises) pour une perception de vitesse accrue. |

---

## 5. Fonctionnalités à ajouter

Voici 5 fonctionnalités à haute valeur ajoutée pour un freelance :

1.  **Chronomètre de mission (Time Tracking)** (🟡 Moyen)
    *   *Quoi* : Un bouton "Start/Stop" sur une mission pour enregistrer le temps réel.
    *   *Valeur* : Précision facturation vs estimations.

2.  **Générateur de Devis/Facture PDF** (🟢 Facile)
    *   *Quoi* : Transformer une mission terminée en PDF stylisé prêt à l'envoi.
    *   *Valeur* : Gain de temps administratif immédiat.

3.  **Portail Client (Lien magique)** (🔴 Complexe)
    *   *Quoi* : Une page publique (lecture seule) partageable avec le client pour qu'il voie l'avancement ou valide les heures.
    *   *Valeur* : Professionnalisme et transparence.

4.  **Assistant IA Contextuel (RAG)** (🟡 Moyen)
    *   *Quoi* : "Combien j'ai gagné le mois dernier comparé à l'an dernier ?" via Gemini.
    *   *Valeur* : Analyse de données sans créer de rapports complexes manuellement.

5.  **Calendrier "Drag & Drop"** (🟡 Moyen)
    *   *Quoi* : Déplacer une mission d'un jour à l'autre dans la vue calendrier pour changer sa date.
    *   *Valeur* : Planification visuelle intuitive.

---

## 6. Performance et Optimisation

**Diagnostic :**
*   `lazy` loading est déjà utilisé, c'est très bien.
*   Le chargement initial charge *toutes* les missions (`select('*')`). Avec 1000 missions, l'app sera lente.

**Recommandations :**

1.  **Pagination / Infinite Scroll** : Ne charger que les missions du mois en cours + futures par défaut. Charger l'historique à la demande.
2.  **Virtualisation** : Utiliser `react-window` si la liste des missions dépasse 50 éléments pour ne rendre que ce qui est visible à l'écran.
3.  **Optimisation Images** : Si vous ajoutez des uploads (logos, avatars), redimensionnez-les côté client avant envoi.

---

## 7. Sécurité et Bonnes Pratiques

**Audit Rapide :**
*   ✅ **RLS** : Vous utilisez `user_id` dans les requêtes, c'est bien, mais il faut s'assurer que les **Policies RLS** Supabase (côté SQL) interdisent bien l'accès aux données d'autres users. Le filtre JS ne suffit pas.
*   ⚠️ **Variables d'env** : Vérifiez que `VITE_GEMINI_API_KEY` n'est pas exposée si elle permet des actions coûteuses (idéalement, passer par une Edge Function Supabase pour appeler Gemini, pour ne pas exposer la clé au client).

---

## 8. Configuration et Tooling

**Manques actuels :** Pas de tests, pas de linter strict visible.

**Recommandations :**

1.  **Biomé ou ESLint+Prettier** : Installer et configurer pour forcer un style de code cohérent.
2.  **Husky** : Un "pre-commit hook" pour empêcher de commiter du code qui ne compile pas.
3.  **Vitest** : Ajouter des tests unitaires, surtout pour `calculations.ts` (argent/heures = critique) et `supabaseService.ts`.

---

## Résumé : Top 5 Actions Prioritaires

Voici votre feuille de route immédiate pour assainir le projet avant d'ajouter des features :

1.  🛠 **Restructuration** : Déplacer tout le code source dans `src/` proprement.
2.  🚦 **Routing** : Installer `react-router-dom` et remplacer la navigation par état.
3.  📦 **Context API** : Créer un `MissionProvider` pour sortir la logique de gestion de données de `App.tsx`.
4.  🧪 **Tests Unitaires** : Écrire des tests pour `calculations.ts` (c'est le cœur financier, il ne doit pas bugger).
5.  💅 **UX Polish** : Remplacer `window.confirm` et `alert` par des composants UI modernes (Toasts/Modales).

