# 📖 API Documentation - NeuroTime

NeuroTime uses **Supabase** as its primary backend and **Google Gemini** for AI features. While the application communicates directly with Supabase via the client SDK, the logical interactions are encapsulated in **Services**.

## 🔑 Authentication

Managed via `authService.ts`.

### `signUp(email, password)`
- **Goal**: Create a new user account.
- **Provider**: Supabase Auth (GoTrue).

### `signIn(email, password)`
- **Goal**: Authenticate an existing user.
- **Returns**: User session object.

### `signOut()`
- **Goal**: End the current sessions and clear local state.

---

## 📅 Missions Management

Managed via `supabaseService.ts`.

### `getMissions()`
- **Method**: `SELECT` from `missions` table.
- **Security**: Filtered by RLS (only user's missions).
- **Sort**: `start_time DESC`.

### `createMission(missionData)`
- **Method**: `INSERT` into `missions`.
- **Fields**: `title`, `client`, `location`, `start_time`, `end_time`, `status`, `rate_type`, `hourly_rate`, etc.

### `updateMission(id, updates)`
- **Method**: `UPDATE` row by ID.
- **Constraint**: Cannot update missions marked as `isPaid: true`.

### `deleteMission(id)`
- **Method**: `DELETE` row by ID.

---

## 🎯 Goals Tracking

Managed via `goalsService.ts`.

### `getGoals()`
- **Method**: `SELECT` from `goals`.
- **Types**: `revenue`, `missions`, `hours`.
- **Periods**: `month`, `year`.

### `upsertGoal(goalData)`
- **Method**: `UPSERT` (Insert or Update if exists).
- **Unique Key**: `(user_id, type, period)`.

---

## 🤖 AI Features (Gemini)

Managed via `geminiService.ts`.

### `enhanceDescription(rawText, context)`
- **Input**:
    - `rawText`: The user's informal notes.
    - `context`: `{ title, client, location }`.
- **Logic**:
    - Prompt-engineered for the freelance event industry.
    - Models used: `gemini-2.5-flash` (or equivalent configured).
- **Output**: A professionalized description string.

---

## 👥 Client Management

Managed via `clientService.ts`.

### `getClients()`
- **Goal**: Get unique list of clients from mission history or dedicated `clients` table.

---

## 🛠️ Environment Variables

The frontend expects the following variables for communication:

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `API_KEY` | Google AI Studio API Key |
