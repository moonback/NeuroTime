## Schéma de base de données (Supabase / PostgreSQL)

### Principes
- Toutes les tables ont `user_id` référencé sur `auth.users(id)` et RLS activé : un utilisateur ne voit/modifie que ses lignes.
- Timestamps : `created_at`, `updated_at` avec trigger `update_updated_at_column()` pour les updates.
- Conventions : snake_case en base, conversion camelCase côté services.

### Tables

#### `missions`
| Colonne | Type | Contraintes / Notes |
| --- | --- | --- |
| id | UUID PK | `gen_random_uuid()` |
| user_id | UUID FK -> auth.users | `ON DELETE CASCADE` |
| title | TEXT | NOT NULL |
| client | TEXT | nullable |
| location | TEXT | NOT NULL |
| description | TEXT | nullable |
| start_time | TIMESTAMPTZ | NOT NULL |
| end_time | TIMESTAMPTZ | NOT NULL |
| status | TEXT | `planned|completed|cancelled` |
| rate_type | TEXT | `day|night|mixed|custom` |
| hourly_rate | NUMERIC(10,2) | défaut 0 |
| total_earnings | NUMERIC(10,2) | défaut 0 |
| details | JSONB | heures jour/nuit calculées |
| logistics | JSONB | `deliveryTime`, `pickupTime` |
| time_slots | JSONB | [{startTime, endTime}] pour multi-créneaux |
| created_at / updated_at | TIMESTAMPTZ | défaut NOW() + trigger |
Index : `idx_missions_user_id`, `idx_missions_start_time`, `idx_missions_status`, `idx_missions_user_start_time`.

#### `clients`
| Colonne | Type | Contraintes / Notes |
| --- | --- | --- |
| id | UUID PK |  |
| user_id | UUID FK |  |
| name | TEXT | NOT NULL |
| created_at / updated_at | TIMESTAMPTZ |  |
Index : `idx_clients_user_id`, `idx_clients_name`, unique `idx_clients_user_name_unique` sur `(user_id, lower(name))`.

#### `goals`
| Colonne | Type | Contraintes / Notes |
| --- | --- | --- |
| id | UUID PK |  |
| user_id | UUID FK |  |
| type | TEXT | `revenue|missions|hours` |
| target | NUMERIC(10,2) | NOT NULL |
| period | TEXT | `month|year` |
| created_at / updated_at | TIMESTAMPTZ |  |
| Unique | (user_id, type, period) |
Index : `idx_goals_user_id`, `idx_goals_user_type_period`.

### Sécurité (RLS)
- Politiques homogènes : SELECT/INSERT/UPDATE/DELETE autorisés uniquement si `auth.uid() = user_id`.
- Triggers `update_updated_at_column()` appliqués aux tables missions, clients, goals.

### Points d’attention
- Toujours utiliser la clé `anon` côté front (les politiques RLS protègent par utilisateur).
- Les montants sont en NUMERIC pour éviter les approximations flottantes.
- `time_slots` stocke plusieurs créneaux par mission ; `start_time` / `end_time` restent pour compatibilité et ordonnancement.

