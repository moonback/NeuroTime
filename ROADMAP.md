# Roadmap — NeuroTime

## V0 — Fonctionnalités déjà livrées

| Statut | Domaine | Élément | Notes |
|---|---|---|---|
| ✅ Fait | Auth | Inscription, connexion, session et déconnexion Supabase | Auth e-mail/mot de passe. |
| ✅ Fait | Missions | CRUD missions | Création, édition, suppression et validation. |
| ✅ Fait | Missions | Créneaux multiples | Stockage `time_slots` JSONB et compatibilité ancienne donnée. |
| ✅ Fait | Missions | Calcul revenus jour/nuit/mixte/custom | Tarifs configurables via préférences. |
| ✅ Fait | Missions | Statuts métier | `planned`, `completed`, `cancelled`. |
| ✅ Fait | Clients | Liste clients et synchronisation depuis missions | Table `clients` et fallback local. |
| ✅ Fait | Paiements | Table paiements, rattachement missions et statut payé | RPC `save_payment_with_missions`. |
| ✅ Fait | Dashboard | KPIs, prochaine mission, missions à venir, historique | Vue synthétique. |
| ✅ Fait | Objectifs | Objectifs revenus/missions/heures | Périodes mois/année. |
| ✅ Fait | Statistiques | Graphiques et agrégations | Recharts. |
| ✅ Fait | URSSAF | Simulateur de cotisations | Basé sur chiffre d'affaires payé. |
| ✅ Fait | Exports | CSV, Markdown et PDF | Selon dashboard et liste missions. |
| ✅ Fait | PWA | Manifest, service worker, icônes, raccourcis | Installation desktop/mobile. |
| ✅ Fait | Realtime | Synchronisation missions et paiements | Canaux Supabase Realtime. |
| ✅ Fait | Offline léger | Cache localStorage par utilisateur/environnement | Fallback en cas d'erreur réseau. |
| ✅ Fait | IA | Appel Edge Function pour améliorer les descriptions | Clé Gemini hors frontend. |
| ✅ Fait | Tests | Tests Vitest sur calculs métier | `src/utils/calculations.test.ts`. |

---

## V1 — Priorités court terme (< 3 mois)

| Statut | Domaine | Élément | Résultat attendu |
|---|---|---|---|
| 📋 Planifié | Migrations | Unifier la source de vérité SQL | Conserver une migration canonique et archiver les scripts historiques. |
| 📋 Planifié | Environnement | Ajouter `.env.example` | Onboarding développeur plus fiable. |
| 📋 Planifié | Licence | Ajouter `LICENSE` MIT ou licence choisie | Clarifier les droits d'utilisation. |
| 📋 Planifié | Tests | Étendre les tests aux validations de mission et aux paiements | Réduire les régressions métier. |
| 📋 Planifié | CI | Ajouter workflow GitHub Actions | Lancer `npm test` et `npm run build` à chaque PR. |
| 📋 Planifié | Edge Function | Versionner `enhance-description` dans le dépôt | Déploiement IA reproductible. |
| 📋 Planifié | Paiements | Améliorer la cohérence locale lors de suppression paiement | Synchroniser localStorage, missions et Supabase sans écart. |
| 📋 Planifié | Accessibilité | Auditer clavier, focus et labels ARIA | Améliorer l'usage mobile/desktop. |
| 📋 Planifié | UX | États vides et erreurs plus explicites | Meilleure compréhension pour les nouveaux utilisateurs. |
| 📋 Planifié | Documentation | Ajouter captures d'écran et schémas visuels | README plus attractif. |

---

## V2+ — Vision long terme

| Statut | Domaine | Élément | Résultat attendu |
|---|---|---|---|
| 💡 Idée | Offline-first | File de mutations locale et reprise automatique | Usage fiable sans réseau. |
| 💡 Idée | Facturation | Génération de factures et avoirs | Transformer les missions payées en documents clients. |
| 💡 Idée | Comptabilité | Export comptable normalisé | CSV/Excel compatible outils de compta. |
| 💡 Idée | Multi-profils | Plusieurs activités ou entreprises par compte | Séparer revenus, clients et taux. |
| 💡 Idée | Notifications | Rappels de missions et paiements impayés | Push PWA ou e-mail. |
| 💡 Idée | Calendrier | Vue calendrier avancée et synchronisation externe | Export ICS ou intégration Google Calendar. |
| 💡 Idée | Mobile | Optimisations PWA avancées | Installation et usage tactile plus proches d'une app native. |
| 💡 Idée | Analytics | Tendances revenus, clients et saisonnalité | Aide à la décision. |
| 💡 Idée | Sécurité | Audit RLS automatisé et tests de politiques | Vérifier l'isolation multi-utilisateur. |
| 💡 Idée | Internationalisation | Support multilingue | Français puis anglais. |

---

## Backlog

| Statut | Idée | Description |
|---|---|---|
| 💡 Idée | Import CSV | Importer des missions existantes depuis un tableur. |
| 💡 Idée | Templates de missions | Préremplir titre, client, lieu, tarifs et horaires. |
| 💡 Idée | Tags | Catégoriser les missions par type d'activité. |
| 💡 Idée | Détection de conflits | Bloquer ou signaler plus fortement les chevauchements horaires. |
| 💡 Idée | Paiements partiels | Suivre les acomptes ou règlements fractionnés. |
| 💡 Idée | Notes privées | Ajouter un champ notes non exporté. |
| 💡 Idée | Sauvegarde utilisateur | Export/import complet JSON du compte. |
| 💡 Idée | Tableau clients | Statistiques par client : CA, temps, impayés. |
| 💡 Idée | Mode démo | Jeu de données local sans compte Supabase. |
| 💡 Idée | Monitoring | Suivi des erreurs frontend et Edge Functions. |
