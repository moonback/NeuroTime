# 🕒 NeuroTime

**NeuroTime** is a premium mission management platform specifically designed for freelancers in the event industry (technicians, managers, hosts). It combines advanced time tracking with automated earnings calculation and AI-powered administrative assistance.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green.svg)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_4-38b2ac.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- **🚀 Advanced Dashboard**: Real-time overview of your activity, revenue, and progress towards your goals.
- **📅 Smart Mission Tracking**: Manage single or multi-slot missions with support for day, night, and custom rates.
- **💰 Automated Earnings**: Instant calculation of daytime vs. nighttime hours and total mission revenue.
- **📊 Detailed Analytics**: Visual charts for revenue trends and hours worked per period.
- **🎯 Goal Setting**: Define monthly or yearly targets for revenue, number of missions, or total hours.
- **🤖 AI description Enhancer**: Use Google Gemini to turn raw notes into professional mission descriptions.
- **📱 PWA Ready**: Installable on mobile and desktop for a native-like experience with offline capabilities.
- **💎 Premium Design**: High-end UI with glassmorphism, aurora effects, and smooth micro-animations.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **State & Logic**: Custom Hooks, React Context
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS)
- **Charts**: [Recharts](https://recharts.org/)
- **AI Integration**: [Google Gemini (Generative AI)](https://ai.google.dev/)
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) project
- A [Google AI API Key](https://aistudio.google.com/) (for Gemini features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/moonback/NeuroTime.git
   cd NeuroTime
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   API_KEY=your_google_gemini_api_key
   ```

4. **Database Setup**
   Execute the content of `supabase_setup.sql` in your Supabase SQL Editor to create the necessary tables and RLS policies.

### Running the Project

- **Development Mode**:
  ```bash
  npm run dev
  ```
  The app will be available at `http://localhost:5173`.

- **Production Build**:
  ```bash
  npm run build
  npm run preview
  ```

---

## 📂 Project Structure

```text
NeuroTime/
├── public/             # Static assets
├── src/
│   ├── components/     # UI Components (Dashboard, Missions, etc.)
│   ├── context/        # React Context (Auth, Missions)
│   ├── hooks/          # Custom Hooks (Preferences, Confirmation)
│   ├── services/       # API & External Services (Supabase, Gemini)
│   ├── types/          # TypeScript Interfaces
│   ├── utils/          # Helper functions
│   ├── App.tsx         # Main entry component
│   └── index.tsx       # Root entry point
├── supabase/           # SQL Migrations and setup
├── .cursorrules        # AI development rules
└── vite.config.ts      # Vite configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please check [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Developed with ❤️ by the NeuroTime Team.
