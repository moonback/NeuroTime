# 🏗️ System Architecture - NeuroTime

This document describes the technical architecture and design patterns used in the NeuroTime application.

## 📍 Overview

NeuroTime is a Single Page Application (SPA) built with a modern decoupled architecture. It uses a **Serverless-first** approach, leveraging Supabase for backend services and Google Gemini for AI capabilities.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Functional Components, Hooks)
- **Build Tool**: Vite (Ultra-fast development and bundling)
- **Styling**: Tailwind CSS 4 (Utility-first, high performance)
- **UI Components**: Custom-built glassmorphism components
- **Routing**: React Router 7
- **Charts**: Recharts (SVG-based responsive charts)

### Backend (BaaS)
- **Supabase**: 
  - **PostgreSQL**: Relational database for missions, goals, and clients.
  - **Auth**: GoTrue for secure user authentication (Email/Password).
  - **RLS (Row Level Security)**: Database-level security ensuring users only access their own data.

### AI Layer
- **Google Gemini API**: Used for NLP tasks like professionalizing mission descriptions.

---

## 🏛️ Frontend Architecture

The frontend follows a modular structure focused on separation of concerns:

### 1. Layers
- **Services (`src/services/`)**: The bridge between the app and external APIs. Each service (Supabase, Gemini, Auth) is isolated.
- **Contexts (`src/context/`)**: Global state management using React Context.
  - `AuthContext`: Manages session state and authentication flows.
  - `MissionContext`: Centralized store for missions, providing CRUD operations.
- **Hooks (`src/hooks/`)**: Reusable logic for UI behavior (e.g., `usePreferences`, `useConfirmDialog`).
- **Components (`src/components/`)**:
  - **Feature Components**: Self-contained UI parts like `CalendarView`, `StatsView`, `Dashboard`.
  - **Base Components**: Reusable UI primitives (Modals, Spinners, Tooltips).
- **Types (`src/types/`)**: Centralized TypeScript definitions to ensure type safety across the stack.

### 2. State Management Flow
1. **Trigger**: User interacts with a component (e.g., clicks "Save Mission").
2. **Hook/Context**: The component calls a function from `MissionContext`.
3. **Service**: `MissionContext` calls `supabaseService`.
4. **Network**: The service performs an async request to Supabase.
5. **Update**: On success, the local state in `MissionContext` is updated, triggering a re-render of dependent components.

---

## 💾 Database Design

The database is built on PostgreSQL with a focus on auditability and security.

- **Primary Entities**: `missions`, `goals`, `clients`.
- **Relational Integrity**: Each entity is linked to `auth.users` via a `user_id` foreign key.
- **Security**: 
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
  - Policies ensure that `auth.uid() = user_id` for all CRUD operations.

---

## 🔄 AI Workflow

The AI integration follows a simple request-response pattern:
1. User provides raw text in the `MissionForm`.
2. App sends text + mission context (title, client) to `geminiService`.
3. Gemini processes the text using a tailored prompt for the event industry.
4. The enhanced description is returned and populated in the form.

---

## 📦 Build & Deployment

- **Optimized Bundling**: uses Vite's code-splitting (lazy loading) for heavy components like `Dashboard` and `StatsView`.
- **PWA Integration**: `vite-plugin-pwa` generates the service worker and manifest for offline support and installability.
- **Standard**: Deployment is compatible with any static hosting (Vercel, Netlify, Github Pages) with a Supabase backend.
