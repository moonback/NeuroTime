# 🗄️ Database Schema - NeuroTime

This document provides a human-readable overview of the Supabase (PostgreSQL) database structure.

## 🛡️ Security & Privacy (RLS)
The database enforces strict **Row Level Security (RLS)** policies:
- All tables contain a `user_id` linked to `auth.users(id)`.
- Users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows where `user_id` matches their authenticated `auth.uid()`.
- RLS is disabled by default and explicitly enabled for every table.

---

## 📋 Tables

### 1. `missions`
The core table storing freelance mission details.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK, Defaults to random | Unique mission identifier |
| `user_id` | UUID | FK -> `auth.users`, CASCADE | Owner of the mission |
| `title` | TEXT | NOT NULL | Name of the mission |
| `client` | TEXT | Nullable | Client or company name |
| `location` | TEXT | NOT NULL | Place of work |
| `description` | TEXT | Nullable | Detailed notes (AI-enhanced optionally) |
| `start_time` | TIMESTAMPTZ | NOT NULL | Scheduled start |
| `end_time` | TIMESTAMPTZ | NOT NULL | Scheduled end |
| `status` | TEXT | `'planned'`, `'completed'`, `'cancelled'` | Current state |
| `rate_type` | TEXT | `'day'`, `'night'`, `'mixed'`, `'custom'` | Pricing model |
| `hourly_rate` | NUMERIC(10,2) | Default 0 | Rate per hour |
| `total_earnings`| NUMERIC(10,2) | Default 0 | Calculated total revenue |
| `details` | JSONB | Nullable | Internal breakdown (day/night hours) |
| `logistics` | JSONB | Nullable | `{ deliveryTime, pickupTime }` |
| `time_slots` | JSONB | Nullable | Array of slots for multi-day/session missions |
| `is_paid` | BOOLEAN | Default `false` | Payment status |
| `created_at` | TIMESTAMPTZ | Default `now()` | Audit timestamp |
| `updated_at` | TIMESTAMPTZ | Default `now()` | Last modification timestamp |

**Indexes**: `idx_missions_user_id`, `idx_missions_start_time`, `idx_missions_status`.

---

### 2. `goals`
Tracks financial and performance objectives.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK | Unique identifier |
| `user_id` | UUID | FK -> `auth.users` | Owner |
| `type` | TEXT | `'revenue'`, `'missions'`, `'hours'` | Type of target |
| `target` | NUMERIC(10,2) | NOT NULL | The goal value (e.g., 5000€) |
| `period` | TEXT | `'month'`, `'year'` | Timeframe |
| `created_at` | TIMESTAMPTZ | Default `now()` | - |

**Unique Constraint**: `(user_id, type, period)` - A user can only have one revenue goal per month.

---

### 3. `clients` (Optional / Dynamic)
Used to keep track of frequent clients for auto-completion.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK | - |
| `user_id` | UUID | FK -> `auth.users` | - |
| `name` | TEXT | NOT NULL | Client name |
| `contact_info` | JSONB | Nullable | Email, phone, etc. |

**Unique Constraint**: `(user_id, lower(name))` - Prevents duplicate clients for the same user.

---

## 🔄 Automated Workflows (Triggers)
Every table includes an `updated_at` trigger:
- **`update_updated_at_column()`**: Automatically sets the `updated_at` column to the current timestamp whenever a row is modified.

## 💡 Implementation Notes
- **Monetary Values**: Always use `NUMERIC(10,2)` to avoid floating-point precision issues with currency.
- **Time Slots**: Complex mission schedules are stored in a `JSONB` array within `missions.time_slots` to keep the schema flexible while allowing deep querying.
