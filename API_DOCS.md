# Référence API — NeuroTime

NeuroTime n'expose pas d'API HTTP propriétaire dans ce dépôt. Les endpoints détectés sont ceux consommés via Supabase JS : Auth, PostgREST, Realtime, RPC et Edge Functions.

Base URL Supabase utilisée dans les exemples :

```bash
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_ANON_KEY="<anon-key>"
ACCESS_TOKEN="<jwt-utilisateur>"
```

---

## Authentification

### POST `/auth/v1/signup`

| Champ | Valeur |
|---|---|
| Description | Crée un compte utilisateur par e-mail et mot de passe. |
| Authentification requise | Non, clé `anon` Supabase requise. |
| Service frontend | `signUp(email, password)` |

#### Paramètres body

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `email` | `string` | Oui | Adresse e-mail du compte. |
| `password` | `string` | Oui | Mot de passe utilisateur. |

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"ChangeMe123!"}'
```

#### Réponse succès

```json
{
  "user": {
    "id": "00000000-0000-0000-0000-000000000000",
    "email": "user@example.com"
  },
  "session": null
}
```

#### Réponse erreur

```json
{
  "error": "invalid_credentials",
  "error_description": "Signup failed"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Compte créé ou confirmation envoyée selon la configuration Supabase. |
| 400 | E-mail ou mot de passe invalide. |
| 429 | Trop de tentatives. |

---

### POST `/auth/v1/token?grant_type=password`

| Champ | Valeur |
|---|---|
| Description | Connecte un utilisateur avec e-mail et mot de passe. |
| Authentification requise | Non, clé `anon` Supabase requise. |
| Service frontend | `signIn(email, password)` |

#### Paramètres query

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `grant_type` | `string` | Oui | Valeur `password`. |

#### Paramètres body

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `email` | `string` | Oui | Adresse e-mail du compte. |
| `password` | `string` | Oui | Mot de passe utilisateur. |

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"ChangeMe123!"}'
```

#### Réponse succès

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "00000000-0000-0000-0000-000000000000",
    "email": "user@example.com"
  }
}
```

#### Réponse erreur

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid login credentials"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Session ouverte. |
| 400 | Identifiants invalides. |
| 429 | Trop de tentatives. |

---

### GET `/auth/v1/user`

| Champ | Valeur |
|---|---|
| Description | Retourne l'utilisateur authentifié courant. |
| Authentification requise | Oui, Bearer JWT. |
| Service frontend | `getCurrentUser()` |

#### Paramètres

Aucun paramètre path, query ou body.

#### Exemple de requête

```bash
curl "$SUPABASE_URL/auth/v1/user" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "email": "user@example.com"
}
```

#### Réponse erreur

```json
{
  "message": "invalid JWT"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Utilisateur retourné. |
| 401 | JWT absent, expiré ou invalide. |

---

### POST `/auth/v1/logout`

| Champ | Valeur |
|---|---|
| Description | Déconnecte la session Supabase courante. |
| Authentification requise | Oui, Bearer JWT. |
| Service frontend | `signOut()` |

#### Paramètres

Aucun paramètre path, query ou body.

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/auth/v1/logout" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
{}
```

#### Réponse erreur

```json
{
  "message": "invalid JWT"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 204 | Session révoquée. |
| 401 | JWT invalide. |

---

## Missions

### GET `/rest/v1/missions?user_id=eq.<user_id>&order=start_time.desc`

| Champ | Valeur |
|---|---|
| Description | Charge les missions de l'utilisateur courant, triées par date de début décroissante. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `loadMissionsFromSupabase()` |

#### Paramètres query

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `user_id` | `uuid` | Oui | Filtre utilisateur. RLS impose aussi `auth.uid() = user_id`. |
| `order` | `string` | Non | `start_time.desc`. |
| `select` | `string` | Non | `*` dans le service actuel. |

#### Exemple de requête

```bash
curl "$SUPABASE_URL/rest/v1/missions?select=*&user_id=eq.$USER_ID&order=start_time.desc" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
[
  {
    "id": "2f4e7e9d-1111-4444-9999-0123456789ab",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "title": "Livraison soirée",
    "client": "Client A",
    "location": "Paris",
    "description": "Mission planifiée",
    "start_time": "2026-06-01T18:00:00.000Z",
    "end_time": "2026-06-01T23:00:00.000Z",
    "status": "planned",
    "rate_type": "night",
    "hourly_rate": 30,
    "total_earnings": 150,
    "details": { "dayHours": 0, "nightHours": 5 },
    "time_slots": [{ "startTime": "18:00", "endTime": "23:00" }],
    "is_paid": false,
    "payment_id": null
  }
]
```

#### Réponse erreur

```json
{
  "code": "42501",
  "message": "new row violates row-level security policy"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Missions retournées. |
| 401 | JWT invalide. |
| 403 | RLS refuse l'accès. |

---

### POST `/rest/v1/missions` avec `Prefer: resolution=merge-duplicates`

| Champ | Valeur |
|---|---|
| Description | Crée ou met à jour une mission via upsert sur `id`. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `saveMissionMutation()`, `saveMissionsToSupabase()` |

#### Paramètres body

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `id` | `uuid` | Oui | Identifiant mission. |
| `user_id` | `uuid` | Oui | Propriétaire. |
| `title` | `text` | Oui | Titre de la mission. |
| `client` | `text` | Non | Nom du client. |
| `location` | `text` | Oui | Lieu. |
| `description` | `text` | Non | Description. |
| `start_time` | `timestamptz` | Oui | Début. |
| `end_time` | `timestamptz` | Oui | Fin, doit être > début. |
| `status` | `planned \| completed \| cancelled` | Oui | État métier. |
| `rate_type` | `day \| night \| mixed \| custom` | Oui | Type de taux. |
| `hourly_rate` | `number` | Non | Taux horaire. |
| `total_earnings` | `number` | Non | Revenu calculé. |
| `details` | `jsonb` | Non | Détail heures jour/nuit. |
| `logistics` | `jsonb` | Non | Horaires livraison/récupération si colonne appliquée. |
| `time_slots` | `jsonb` | Non | Créneaux multiples. |
| `is_paid` | `boolean` | Non | Statut payé. |
| `payment_id` | `uuid` | Non | Paiement associé. |

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/rest/v1/missions?on_conflict=id&select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d '{
    "id":"2f4e7e9d-1111-4444-9999-0123456789ab",
    "user_id":"00000000-0000-0000-0000-000000000000",
    "title":"Livraison soirée",
    "client":"Client A",
    "location":"Paris",
    "start_time":"2026-06-01T18:00:00.000Z",
    "end_time":"2026-06-01T23:00:00.000Z",
    "status":"planned",
    "rate_type":"night",
    "hourly_rate":30,
    "total_earnings":150
  }'
```

#### Réponse succès

```json
[
  {
    "id": "2f4e7e9d-1111-4444-9999-0123456789ab",
    "status": "planned",
    "total_earnings": 150
  }
]
```

#### Réponse erreur

```json
{
  "code": "23514",
  "message": "new row for relation \"missions\" violates check constraint \"chk_missions_time_order\""
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 / 201 | Mission créée ou mise à jour. |
| 400 | Contrainte SQL invalide. |
| 401 | JWT invalide. |
| 403 | RLS refuse l'opération. |
| 409 | Conflit d'unicité hors stratégie upsert. |

---

### DELETE `/rest/v1/missions?id=eq.<mission_id>&user_id=eq.<user_id>`

| Champ | Valeur |
|---|---|
| Description | Supprime une mission appartenant à l'utilisateur courant. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `deleteMissionFromSupabase()` |

#### Paramètres query

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `id` | `uuid` | Oui | Identifiant de mission. |
| `user_id` | `uuid` | Oui | Propriétaire. |

#### Exemple de requête

```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/missions?id=eq.$MISSION_ID&user_id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
[]
```

#### Réponse erreur

```json
{
  "message": "JWT expired"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 204 | Mission supprimée. |
| 401 | JWT invalide. |
| 403 | RLS refuse la suppression. |

---

## Clients

### GET `/rest/v1/clients?user_id=eq.<user_id>&order=name.asc`

| Champ | Valeur |
|---|---|
| Description | Charge les clients de l'utilisateur, triés par nom. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `loadClientsFromSupabase()` |

#### Paramètres query

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `user_id` | `uuid` | Oui | Propriétaire. |
| `order` | `string` | Non | `name.asc`. |

#### Exemple de requête

```bash
curl "$SUPABASE_URL/rest/v1/clients?select=*&user_id=eq.$USER_ID&order=name.asc" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "name": "Client A",
    "created_at": "2026-05-31T10:00:00.000Z"
  }
]
```

#### Réponse erreur

```json
{
  "code": "42501",
  "message": "permission denied"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Clients retournés. |
| 401 | JWT invalide. |
| 403 | RLS refuse l'accès. |

---

### POST `/rest/v1/clients`

| Champ | Valeur |
|---|---|
| Description | Ajoute un client si le nom n'existe pas déjà pour l'utilisateur. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `addClientToSupabase()` |

#### Paramètres body

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `id` | `uuid` | Oui | Identifiant client. |
| `user_id` | `uuid` | Oui | Propriétaire. |
| `name` | `text` | Oui | Nom du client. |
| `created_at` | `timestamptz` | Non | Date de création. |

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/rest/v1/clients?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"id":"11111111-1111-1111-1111-111111111111","user_id":"00000000-0000-0000-0000-000000000000","name":"Client A"}'
```

#### Réponse succès

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "name": "Client A"
}
```

#### Réponse erreur

```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint \"idx_clients_user_name_unique\""
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 201 | Client créé. |
| 400 | Nom invalide. |
| 401 | JWT invalide. |
| 403 | RLS refuse l'insertion. |
| 409 | Doublon client. |

---

## Objectifs

### GET `/rest/v1/goals?user_id=eq.<user_id>&order=created_at.asc`

| Champ | Valeur |
|---|---|
| Description | Charge les objectifs de revenus, missions ou heures de l'utilisateur. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `loadGoalsFromSupabase()` |

#### Paramètres query

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `user_id` | `uuid` | Oui | Propriétaire. |
| `order` | `string` | Non | `created_at.asc`. |

#### Exemple de requête

```bash
curl "$SUPABASE_URL/rest/v1/goals?select=*&user_id=eq.$USER_ID&order=created_at.asc" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
[
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "type": "revenue",
    "target": 5000,
    "period": "month"
  }
]
```

#### Réponse erreur

```json
{
  "code": "42501",
  "message": "permission denied"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Objectifs retournés. |
| 401 | JWT invalide. |
| 403 | RLS refuse l'accès. |

---

### POST `/rest/v1/goals` avec `Prefer: resolution=merge-duplicates`

| Champ | Valeur |
|---|---|
| Description | Crée ou met à jour un objectif. L'unicité métier est `user_id`, `type`, `period`. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `saveGoalToSupabase()`, `saveGoalsToSupabase()` |

#### Paramètres body

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `id` | `uuid` | Oui | Identifiant objectif. |
| `user_id` | `uuid` | Oui | Propriétaire. |
| `type` | `revenue \| missions \| hours` | Oui | Type d'objectif. |
| `target` | `number` | Oui | Valeur cible. |
| `period` | `month \| year` | Oui | Période. |
| `created_at` | `timestamptz` | Non | Création. |
| `updated_at` | `timestamptz` | Non | Mise à jour. |

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/rest/v1/goals?on_conflict=id&select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  -d '{"id":"22222222-2222-2222-2222-222222222222","user_id":"00000000-0000-0000-0000-000000000000","type":"revenue","target":5000,"period":"month"}'
```

#### Réponse succès

```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "type": "revenue",
  "target": 5000,
  "period": "month"
}
```

#### Réponse erreur

```json
{
  "code": "23514",
  "message": "new row violates check constraint \"goals_type_check\""
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 / 201 | Objectif créé ou mis à jour. |
| 400 | Type ou période invalide. |
| 401 | JWT invalide. |
| 403 | RLS refuse l'opération. |
| 409 | Doublon métier. |

---

### DELETE `/rest/v1/goals?id=eq.<goal_id>&user_id=eq.<user_id>`

| Champ | Valeur |
|---|---|
| Description | Supprime un objectif utilisateur. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `deleteGoalFromSupabase()` |

#### Exemple de requête

```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/goals?id=eq.$GOAL_ID&user_id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
[]
```

#### Réponse erreur

```json
{
  "message": "JWT expired"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 204 | Objectif supprimé. |
| 401 | JWT invalide. |
| 403 | RLS refuse la suppression. |

---

## Paiements

### GET `/rest/v1/payments?user_id=eq.<user_id>&order=date.desc`

| Champ | Valeur |
|---|---|
| Description | Charge les paiements/virements de l'utilisateur. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `loadPaymentsFromSupabase()` |

#### Paramètres query

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `user_id` | `uuid` | Oui | Propriétaire. |
| `order` | `string` | Non | `date.desc`. |

#### Exemple de requête

```bash
curl "$SUPABASE_URL/rest/v1/payments?select=*&user_id=eq.$USER_ID&order=date.desc" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
[
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "date": "2026-06-05",
    "amount": 450,
    "client": "Client A",
    "mission_ids": ["2f4e7e9d-1111-4444-9999-0123456789ab"],
    "method": "virement"
  }
]
```

#### Réponse erreur

```json
{
  "code": "42501",
  "message": "permission denied"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Paiements retournés. |
| 401 | JWT invalide. |
| 403 | RLS refuse l'accès. |

---

### POST `/rest/v1/rpc/save_payment_with_missions`

| Champ | Valeur |
|---|---|
| Description | Enregistre un paiement et marque atomiquement les missions associées comme payées. |
| Authentification requise | Oui, Bearer JWT + RLS + `auth.uid()`. |
| Service frontend | `savePaymentToSupabase()` |

#### Paramètres body

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `payment_payload` | `jsonb` | Oui | Objet paiement au format frontend. |
| `payment_payload.id` | `uuid` | Oui | Identifiant paiement. |
| `payment_payload.date` | `date` | Oui | Date du paiement. |
| `payment_payload.amount` | `number` | Oui | Montant. |
| `payment_payload.client` | `string` | Oui | Client concerné. |
| `payment_payload.description` | `string` | Non | Description. |
| `payment_payload.reference` | `string` | Non | Référence bancaire ou interne. |
| `payment_payload.missionIds` | `uuid[]` | Oui | Missions à rattacher. |
| `payment_payload.method` | `virement \| cash \| check \| other` | Oui | Moyen de paiement. |
| `payment_payload.createdAt` | `timestamptz` | Non | Date de création frontend. |

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/save_payment_with_missions" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_payload": {
      "id": "33333333-3333-3333-3333-333333333333",
      "date": "2026-06-05",
      "amount": 450,
      "client": "Client A",
      "description": "Virement semaine 23",
      "reference": "VIR-2026-001",
      "missionIds": ["2f4e7e9d-1111-4444-9999-0123456789ab"],
      "method": "virement",
      "createdAt": "2026-06-05T08:00:00.000Z"
    }
  }'
```

#### Réponse succès

```json
null
```

#### Réponse erreur

```json
{
  "code": "P0001",
  "message": "Accès non autorisé : user_id ne correspond pas à auth.uid()"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 / 204 | Paiement sauvegardé et missions mises à jour. |
| 400 | Payload invalide ou contrainte SQL violée. |
| 401 | JWT invalide. |
| 403 | RLS ou contrôle propriétaire refuse l'opération. |

---

### DELETE `/rest/v1/payments?id=eq.<payment_id>&user_id=eq.<user_id>`

| Champ | Valeur |
|---|---|
| Description | Supprime un paiement après avoir remis les missions associées à `is_paid = false` et `payment_id = null`. |
| Authentification requise | Oui, Bearer JWT + RLS. |
| Service frontend | `deletePaymentFromSupabase()` |

#### Paramètres query

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `id` | `uuid` | Oui | Identifiant du paiement. |
| `user_id` | `uuid` | Oui | Propriétaire. |

#### Exemple de requête

```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/payments?id=eq.$PAYMENT_ID&user_id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Réponse succès

```json
[]
```

#### Réponse erreur

```json
{
  "message": "JWT expired"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 204 | Paiement supprimé. |
| 401 | JWT invalide. |
| 403 | RLS refuse la suppression. |

---

## IA

### POST `/functions/v1/enhance-description`

| Champ | Valeur |
|---|---|
| Description | Améliore une description brute de mission via Google Gemini côté serveur. |
| Authentification requise | Oui, Bearer JWT Supabase selon configuration Edge Function. |
| Service frontend | `enhanceDescription(rawText, context)` |

#### Paramètres body

| Nom | Type | Requis | Description |
|---|---|---:|---|
| `rawText` | `string` | Oui | Texte brut saisi par l'utilisateur. |
| `context.title` | `string` | Oui | Titre de mission. |
| `context.location` | `string` | Oui | Lieu. |
| `context.client` | `string` | Oui | Client. |

#### Exemple de requête

```bash
curl -X POST "$SUPABASE_URL/functions/v1/enhance-description" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rawText":"livraison urgente soir",
    "context":{"title":"Mission soir","location":"Paris","client":"Client A"}
  }'
```

#### Réponse succès

```json
{
  "text": "Livraison urgente en soirée pour Client A à Paris."
}
```

#### Réponse erreur

```json
{
  "error": "Gemini API key missing"
}
```

#### Codes HTTP

| Code | Signification |
|---:|---|
| 200 | Description améliorée. |
| 400 | Body invalide. |
| 401 | Authentification manquante ou invalide. |
| 500 | Erreur Edge Function ou fournisseur IA. |

> ⚠️ À compléter : le code de l'Edge Function `enhance-description` n'est pas inclus dans ce dépôt. Les détails exacts des erreurs peuvent donc varier selon le déploiement Supabase.

---

## Realtime

### WebSocket Supabase Realtime `/realtime/v1/websocket`

| Champ | Valeur |
|---|---|
| Description | Abonnement aux changements PostgreSQL des tables `missions` et `payments` filtrés par `user_id`. |
| Authentification requise | Oui, JWT Supabase. |
| Service frontend | `MissionProvider` |

#### Canaux détectés

| Canal | Table | Filtre | Événements |
|---|---|---|---|
| `missions:user:<user_id>` | `missions` | `user_id=eq.<user_id>` | `INSERT`, `UPDATE`, `DELETE` |
| `payments:user:<user_id>` | `payments` | `user_id=eq.<user_id>` | `INSERT`, `UPDATE`, `DELETE` |

#### Exemple conceptuel

```typescript
supabase
  .channel(`missions:user:${user.id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'missions',
    filter: `user_id=eq.${user.id}`
  }, handlePayload)
  .subscribe();
```

#### Codes / états

| État | Signification |
|---|---|
| `SUBSCRIBED` | Abonnement actif. |
| `CHANNEL_ERROR` | Canal refusé ou erreur réseau. |
| `TIMED_OUT` | Timeout d'abonnement. |
| `CLOSED` | Canal fermé. |
